/* 交互功能测试：模拟真实用户操作
   2026-09-18 改版说明：
   产品定位调整为「网页端配合 Hermes，只负责看和勾」，手动录入入口已被移除
   （见 app.js 的 MANUAL_INPUT_ACTIONS）。因此本测试改为两段式：
     ① 断言录入入口确实不存在（防回归）
     ② 注入数据（模拟 Hermes 写入云端 → 网页拉取）后，验证展示与勾选流程仍正常 */
const puppeteer = require("puppeteer-core");
const B = require("./baseline.json");     /* 单一基线：数字只从 tests/baseline.json 读 */
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://localhost:8000";

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  /* 绕过 Service Worker：SW 装上后首次 load 会触发 controllerchange → 页面自我 reload，
     如果 reload 正好落在遍历视图的过程中，window.W 会被冲掉、断言全部误报
     （2026-09-18 实测：报"跳转到 ?"，白排查一轮）。本测试是查 DOM，SW 没用。 */
  try { await page.setBypassServiceWorker(true); } catch (e) { console.log("   (setBypassServiceWorker 不可用)"); }
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on("pageerror", e => errors.push(String(e).slice(0, 200)));
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 20000 });
  await new Promise(r => setTimeout(r, 600));

  const results = [];
  const check = (name, pass, detail) => { results.push({ name, pass }); console.log((pass ? "PASS" : "FAIL") + " | " + name + (detail ? " | " + detail : "")); };
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- 1. 录入入口已移除（C 组防回归）
     双重断言，防止 2026-09-18 那种"白名单名字跟模板对不上"的漏删：
       ① 按 data-action 查：直接读 app.js 的 MANUAL_INPUT_ACTIONS（唯一真源，不再手抄）
       ② 按可见文字查：任何「＋/上传/添加/新建/导入」开头的按钮都不该存在
          （例外见 keepText：那是数据恢复/管理弹窗，属于"看和勾"之外的合法工具） ---------- */
  const appSrc = require("fs").readFileSync(__dirname + "/../app.js", "utf8");
  const mActs = appSrc.match(/var MANUAL_INPUT_ACTIONS = \[([\s\S]*?)\];/);
  const goneActions = mActs ? (mActs[1].match(/"([a-z0-9\-]+)"/g) || []).map(s => s.replace(/"/g, "")) : [];
  check("读到 MANUAL_INPUT_ACTIONS（防漏删的真源）", goneActions.length >= B["录入入口白名单下限"], "白名单 " + goneActions.length + " 项");
  const leakedInputs = await page.evaluate(list => list.filter(a => !!document.querySelector('[data-action="' + a + '"]')), goneActions);
  check("手动录入入口已移除（按 action 名）", leakedInputs.length === 0, "残留=" + (leakedInputs.join(",") || "无"));

  /* 例外：数据恢复/管理弹窗 + 云端同步（不是"录入内容"，是数据搬运工具） */
  const keepText = ["导入数据（恢复）", "选择文件并导入", "任务说明与调整", "立即上传本地数据"];
  const TEXT_CHECK = `(keep => {
    const bad = [];
    document.querySelectorAll("button, a").forEach(b => {
      const t = (b.textContent || "").trim();
      if (!t) return;
      if (!/^(＋|\\+)|上传|添加|新建|导入/.test(t)) return;
      if (keep.some(k => t.indexOf(k) >= 0)) return;
      if (!b.offsetParent) return; /* 不可见的不算 */
      bad.push(t + "[" + (b.getAttribute("data-action") || "") + "]");
    });
    return bad;
  })`;
  /* 遍历所有视图 —— 漏删的入口往往在二级页（2026-09-18 就漏在考研页和设置页）。
     二级页没有导航入口，但事件是 document 委托的：注入一个带 data-action="go-view"
     的临时按钮点一下即可跳转，不需要 app 暴露导航函数。 */
  const SUB_VIEWS = ["cet-vocab", "cet-wordbook", "cet-exams", "cet-stats",
    "ky-mistake-files", "ky-stats", "ky-math", "ky-english", "ky-politics", "ky-major",
    "tasks-all", "library", "inbox", "hermes", "search", "settings"];
  const topViews = await page.$$eval('[data-action="nav"]', els => Array.from(new Set(els.map(e => e.getAttribute("data-view")))).filter(Boolean));
  const checkViews = Array.from(new Set([...topViews, ...SUB_VIEWS]));
  const goView = async x => {
    const ok = await page.evaluate(v => {
      const hit = document.querySelector('[data-action="nav"][data-view="' + v + '"]') ||
        document.querySelector('[data-action="go-view"][data-view="' + v + '"]');
      if (hit) { hit.click(); return true; }
      const fake = document.createElement("button");
      fake.setAttribute("data-action", "go-view");
      fake.setAttribute("data-view", v);
      document.body.appendChild(fake);
      fake.click();
      fake.remove();
      return true;
    }, x);
    await wait(420);
    return ok;
  };
  const leaksByView = {};
  const deadViews = [];
  const lsTrace = [];
  const staleByView = {};
  /* 残留文案扫描：入口删了，但说明文字/空态提示还在描述旧流程 ——
     用户 2026-09-18 就现场抓到资料库顶栏还写着「链接识别」。
     只扫 viewWrap 的 innerText（可见文本、不含弹窗，弹窗在 viewWrap 之外）。
     ⚠️ 更新日志（.log-item）要先排除：日志按定义就是历史记录，里面出现
     「添加自定义任务」这类旧描述是**正确**的，不算残留文案。 */
  const STALE = ["粘贴链接", "链接识别", "链接自动识别", "新建资料", "添加收集",
    "添加任务", "添加生词", "上传 PDF", "添加知识点总结", "添加自定义任务",
    "新建备考方案", "批量导入生词", "导入生词", "上传到云端"];
  for (const v of checkViews) {
    await goView(v);
    const st = await page.evaluate(list => {
      const box = document.getElementById("viewWrap");
      const logs = Array.from(box.querySelectorAll(".log-item"));
      logs.forEach(n => { n.style.display = "none"; });     // 临时藏起来，innerText 就不会算进去
      const t = box.innerText || "";
      logs.forEach(n => { n.style.display = ""; });
      return {
        v: (window.W && window.W.ui && window.W.ui.view) || "?",
        ls: localStorage.getItem("wb_data_v1") ? localStorage.getItem("wb_data_v1").length : 0,
        stale: list.filter(p => t.indexOf(p) >= 0)
      };
    }, STALE);
    lsTrace.push(v + ":" + st.ls);
    if (st.v !== v) deadViews.push(v + "→" + st.v);
    if (st.stale.length) staleByView[v] = st.stale;
    const bad = await page.evaluate(new Function("keep", "return " + TEXT_CHECK + "(keep)"), keepText);
    if (bad.length) leaksByView[v] = bad;
  }
  console.log("   [lsTrace] " + lsTrace.join(" "));
  check("没有指向已下线功能的残留文案（" + STALE.length + " 个词 × " + checkViews.length + " 个视图）",
    Object.keys(staleByView).length === 0,
    Object.keys(staleByView).length ? JSON.stringify(staleByView) : "残留=无");
  const totalViews = checkViews.length;
  check("抽查的视图都跳转成功（网没铺空）", deadViews.length === 0,
    deadViews.length ? "跳错：" + deadViews.join(",") : totalViews + " 个视图全部到位");
  check("手动录入入口已移除（遍历 " + totalViews + " 个视图按可见文字）",
    Object.keys(leaksByView).length === 0,
    Object.keys(leaksByView).length ? JSON.stringify(leaksByView) : "残留=无");
  /* 回到今日页，后面的用例依赖它 */
  await page.evaluate(() => { const b = document.querySelector('[data-action="nav"][data-view="today"]'); if (b) b.click(); });
  await wait(400);

  /* ---------- 1b. 数据迁移：预置示例资料会被自动清掉（2026-09-18 防回归）----------
     背景：示例资料硬编码在 defaultData() 里，其中 2 条网址是假的（example123）永远打不开。
     光删云端没用 —— 设备上的本地副本会被自动同步推回云端（实测删完几分钟就回来了），
     所以改成 migrate() 里按标题「（示例）」清。这里注入两条，reload 后验证一清一留。 */
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("wb_data_v1"));
    d.resources = d.resources || [];
    d.resources.unshift({ id: "r_probe_drop", title: "探针示例（示例）", url: "https://pan.baidu.com/s/example123", createdAt: "2026-09-18" });
    d.resources.unshift({ id: "r_probe_keep", title: "正常资料应保留", url: "https://www.bilibili.com/video/BV1real", createdAt: "2026-09-18" });
    localStorage.setItem("wb_data_v1", JSON.stringify(d));
  });
  await page.reload({ waitUntil: "networkidle0" });
  await wait(700);
  const migrated = await page.evaluate(() => {
    const rs = JSON.parse(localStorage.getItem("wb_data_v1")).resources || [];
    return { drop: rs.some(r => r.id === "r_probe_drop"), keep: rs.some(r => r.id === "r_probe_keep") };
  });
  check("示例资料被 migrate 自动清掉（含打不开的假网址）", migrated.drop === false, migrated.drop ? "!! 仍在" : "已清掉");
  check("正常资料不被迁移误删", migrated.keep === true, migrated.keep ? "保留" : "!! 被误删");
  await page.evaluate(() => {                    /* 收拾探针，别影响后面的断言 */
    const d = JSON.parse(localStorage.getItem("wb_data_v1"));
    d.resources = (d.resources || []).filter(r => r.id !== "r_probe_keep");
    localStorage.setItem("wb_data_v1", JSON.stringify(d));
  });

  /* ---------- 2. 注入一条任务（模拟 Hermes 写入）→ 今日页应显示 ---------- */
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("wb_data_v1"));
    d.tasks = d.tasks || [];
    d.tasks.unshift({ id: "t_test1", title: "交互测试任务：复习高数第三章", domainId: "kaoyan", date: "", due: "", done: false, note: "", createdAt: "2026-09-18" });
    localStorage.setItem("wb_data_v1", JSON.stringify(d));
  });
  await page.reload({ waitUntil: "networkidle0" });
  await wait(800);
  const shownTitles = await page.$$eval(".home-task .ht-name", els => els.map(e => e.textContent));
  check("Hermes 写入的任务显示在今日页", shownTitles.some(t => t.includes("交互测试任务")), "今日任务 " + shownTitles.length + " 条");

  /* ---------- 3. 勾选完成（网页端的核心操作） ---------- */
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(".home-task"));
    const row = rows.filter(r => r.textContent.indexOf("交互测试任务") >= 0)[0];
    if (row) row.querySelector(".box").click();
  });
  await wait(700);
  const doneInStore = await page.evaluate(() => JSON.parse(localStorage.getItem("wb_data_v1")).tasks.some(t => t.id === "t_test1" && t.done));
  check("任务勾选完成", doneInStore, "t_test1 已标记 done");

  /* ---------- 4. 快速打卡 ---------- */
  await page.click('.nav-item[data-view="today"]');
  await wait(400);
  await page.click('[data-action="punch"]');
  await wait(300);
  await page.type("#pMin", "45");
  await page.click('[data-action="submit-punch"]');
  await wait(400);
  await page.click('[data-action="modal-close"]').catch(() => { });
  await wait(300);
  const punchText = await page.$eval("#viewWrap", el => el.textContent).catch(() => "");
  check("打卡学习", punchText.includes("本周累计") || punchText.includes("打卡"), "");

  /* ---------- 5. 注入一份资料（模拟 Hermes 写入）→ 资料库应显示 ---------- */
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("wb_data_v1"));
    d.resources = d.resources || [];
    d.resources.unshift({ id: "r_test1", title: "测试资料标题", url: "https://www.bilibili.com/video/BV1GJ411x7h7", platform: "哔哩哔哩", cat: "视频", tags: [], domainId: "kaoyan", createdAt: "2026-09-18" });
    localStorage.setItem("wb_data_v1", JSON.stringify(d));
  });
  await page.reload({ waitUntil: "networkidle0" });
  await wait(700);
  await page.click('.nav-item[data-view="library"]');
  await wait(400);
  const libHas = await page.$$eval(".list-item, .res-item, .card", els => els.some(e => e.textContent.includes("测试资料标题")));
  check("Hermes 写入的资料显示在资料库", libHas, "");

  /* ---------- 6. 注入一条收集箱内容（模拟 Hermes 收集）→ 分拣流程仍可用 ---------- */
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("wb_data_v1"));
    d.inbox = d.inbox || [];
    d.inbox.unshift({ id: "ib_test1", content: "https://pan.baidu.com/s/abcdefg123 提取码: x9y8", url: "https://pan.baidu.com/s/abcdefg123", platform: "百度网盘", suggestion: "建议存入资料库", status: "待分拣", createdAt: "2026-09-18" });
    localStorage.setItem("wb_data_v1", JSON.stringify(d));
  });
  await page.reload({ waitUntil: "networkidle0" });
  await wait(700);
  await page.click('.nav-item[data-view="inbox"]');
  await wait(400);
  const inboxShown = await page.$$eval("#viewWrap", els => els[0].textContent.includes("百度网盘") || els[0].textContent.includes("待分拣"));
  check("Hermes 收集的内容显示在收集箱", inboxShown, "");
  await page.click('[data-action="sort-inbox"]');
  await wait(300);
  await page.select("#sortTarget", "library");
  await page.click('[data-action="submit-sort"]');
  await wait(500);
  const moved = await page.$$eval(".card-head", els => els.some(e => e.textContent.includes("已分拣")));
  check("收集箱确认分拣", moved, "");

  /* ---------- 7. 搜索 ---------- */
  await page.click('.nav-item[data-view="search"]');
  await page.waitForSelector("#searchInput", { timeout: 4000 }).catch(() => { });
  await page.type("#searchInput", "测试资料");
  await page.click('[data-action="do-search"]');
  await wait(500);
  const found = await page.$$eval(".search-group-title", els => els.map(e => e.textContent).join(",")).catch(() => "");
  check("跨模块搜索", found.includes("资料"), "结果分组=" + found);

  /* ---------- 8. 导出数据（检查触发下载） ---------- */
  const fs = require("fs");
  fs.mkdirSync("./_attic/downloads-test", { recursive: true });
  const client = await page.createCDPSession();
  await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: "E:\\Software\\workbench\\_attic\\downloads-test" });
  await page.click('.nav-item[data-view="settings"]');
  await wait(300);
  const dlPromise = new Promise(resolve => page.once("download", e => resolve(e.suggestedFilename())));
  await page.click('[data-action="export-data"]');
  const dl = await Promise.race([dlPromise, new Promise(r => setTimeout(() => r(null), 3000))]);
  const dlFiles = fs.readdirSync("./downloads");
  check("导出数据文件", dl !== null || dlFiles.length > 0, (dl || dlFiles.join(",")) + " 文件数=" + dlFiles.length);

  /* ---------- 9. A 组（2026-09-18）：专注/健康/日历/账号/AI帮手 已从产品删除 ---------- */
  const navViews = await page.$$eval(".nav-item", els => els.map(e => e.dataset.view));
  const shouldBeGone = B["已删板块"];
  const leakedNav = shouldBeGone.filter(v => navViews.indexOf(v) >= 0);
  check("已删板块不在导航中", leakedNav.length === 0, "泄漏=" + (leakedNav.join(",") || "无") + " 导航项=" + navViews.length);

  /* ---------- 10. 回收站：打开资料详情再删除一条 ---------- */
  await page.click('.nav-item[data-view="library"]');
  await wait(300);
  await page.evaluate(() => {
    const b = document.querySelector('[data-action="lib-open"]');
    if (b) b.click();
  });
  await wait(400);
  await page.click('[data-action="del-resource"]');
  await wait(400);
  await page.click('.nav-item[data-view="settings"]');
  await wait(400);
  const trashCount = await page.$$eval("#viewWrap .list-item", els => els.length);
  check("删除进回收站", trashCount > 0, "回收站条目=" + trashCount);

  check("全程无JS错误", errors.length === 0, errors.join(" ;; ").slice(0, 200));

  await browser.close();

  /* 汇总 + 退出码：断言失败必须让进程非 0 退出，否则自动化看不出失败
     （2026-09-18 变异测试抓到的：原来全 FAIL 也退出 0）。 */
  const failed = results.filter(r => !r.pass);
  console.log("DONE  " + (results.length - failed.length) + " PASS / " + failed.length + " FAIL");
  if (failed.length) console.log("失败清单：\n  " + failed.map(f => f.name + " | " + (f.detail || "")).join("\n  "));
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error("FATAL", e); process.exit(1); });

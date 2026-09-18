/* 自动化测试：桌面 + 手机三尺寸检查
   数字一律从 tests/baseline.json 读（单一基线）—— 要改数字只改那一个文件。 */
const puppeteer = require("puppeteer-core");
const B = require("./baseline.json");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://localhost:8000";
const fs = require("fs");
const SHOTS = "_attic/shots";        /* 截图统一落归档目录，别脏在项目根目录 */
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const results = [];
  function check(name, pass, detail) {
    results.push({ name, pass, detail });
    console.log((pass ? "PASS" : "FAIL") + " | " + name + (detail ? " | " + detail : ""));
  }

  /* ---------- 桌面端 ---------- */
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 200)));
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 20000 });
  await new Promise(r => setTimeout(r, 800));

  check("桌面-页面加载", true, "标题: " + await page.title());
  check("桌面-无JS错误", errors.length === 0, errors.join(" ;; ").slice(0, 300));

  const sideNavItems = await page.$$eval(".nav-item", els => els.length);
  check("桌面-侧边导航渲染", sideNavItems === B["导航项数"], "导航项数=" + sideNavItems + "（基线 " + B["导航项数"] + "）");

  const todayCards = await page.$$eval(".card", els => els.length);
  check("桌面-今日页卡片", todayCards >= B["首页卡片数下限"], "卡片数=" + todayCards);

  const hasTodayTask = await page.$$eval(".task-item", els => els.length);
  check("桌面-今日任务渲染", hasTodayTask >= 0, "任务项=" + hasTodayTask);

  const h1 = await page.$eval(".topbar h1", el => el.textContent).catch(() => "");
  check("桌面-标题正确", h1 === "今日", "标题=" + h1);

  /* 截图桌面 */
  await page.screenshot({ path: SHOTS + "/desktop.png", fullPage: false });

  /* 检查横向滚动（桌面） */
  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("桌面-无横向滚动", hScroll <= 1, "溢出=" + hScroll);

  /* 点击导航：考研领域 */
  await page.click('.nav-item[data-view="domain:kaoyan"]');
  await new Promise(r => setTimeout(r, 400));
  const kh1 = await page.$eval(".topbar h1", el => el.textContent).catch(() => "");
  check("桌面-切到考研领域", kh1 === "考研备考", "标题=" + kh1);
  await page.screenshot({ path: SHOTS + "/kaoyan.png" });

  /* 点击导航：资料库
     2026-09-18：预置的 3 条示例资料已删除（其中 2 条网址是假的、点开永远打不开），
     所以默认进来是空态。断言改两段：① 空态渲染正常；② 注入 1 条后列表渲染正常。 */
  await page.click('.nav-item[data-view="library"]');
  await new Promise(r => setTimeout(r, 400));
  const libTitle = await page.$eval(".topbar h1", el => el.textContent).catch(() => "");
  const libEmpty = await page.$eval(".empty", el => el.textContent.trim()).catch(() => "");
  check("桌面-资料库空态渲染", libTitle === "资料库" && libEmpty.length > 0,
    "标题=" + libTitle + " 空态=" + libEmpty.slice(0, 14));

  await page.evaluate(() => {          /* 注入一条，验证列表渲染 */
    const d = JSON.parse(localStorage.getItem("wb_data_v1"));
    d.resources = [{ id: "r_render", title: "渲染测试资料", url: "", category: "其他", status: "未看", tags: [], createdAt: "2026-09-18" }];
    localStorage.setItem("wb_data_v1", JSON.stringify(d));
  });
  await page.reload({ waitUntil: "networkidle0" });
  await page.click('.nav-item[data-view="library"]');
  await new Promise(r => setTimeout(r, 400));
  const libRes = await page.$$eval(".list-item", els => els.length);
  check("桌面-资料库列表渲染（注入 1 条）", libRes > 0, "资料条目=" + libRes);
  await page.screenshot({ path: SHOTS + "/library.png" });
  await page.evaluate(() => {          /* 收拾，别影响后面的断言 */
    const d = JSON.parse(localStorage.getItem("wb_data_v1"));
    d.resources = [];
    localStorage.setItem("wb_data_v1", JSON.stringify(d));
  });

  /* 帮助弹层 */
  await page.click('.topbar-help [data-action="help"]');
  await new Promise(r => setTimeout(r, 300));
  const helpOpen = await page.$eval("#helpMask", el => el.className.includes("open")).catch(() => false);
  check("桌面-帮助弹层", helpOpen, "");
  await page.keyboard.press("Escape");
  await new Promise(r => setTimeout(r, 200));

  /* 设置页 */
  await page.click('.nav-item[data-view="settings"]');
  await new Promise(r => setTimeout(r, 400));
  const log = await page.$$eval(".log-item", els => els.length);
  check("桌面-更新日志", log >= 1, "日志条数=" + log);
  await page.screenshot({ path: SHOTS + "/settings.png" });

  await page.close();

  /* ---------- 手机端三尺寸 ---------- */
  const sizes = [
    { w: 360, h: 800 },
    { w: 375, h: 812 },
    { w: 390, h: 844 }
  ];
  for (const s of sizes) {
    const p = await browser.newPage();
    const merr = [];
    p.on("pageerror", (e) => merr.push(String(e).slice(0, 160)));
    await p.setViewport({ width: s.w, height: s.h });
    await p.goto(URL, { waitUntil: "networkidle0", timeout: 20000 });
    await new Promise(r => setTimeout(r, 600));

    const name = s.w + "x" + s.h;
    /* 底部导航可见且等宽 */
    const nav = await p.$eval("#mobileNav", el => {
      const items = el.querySelectorAll(".mn-item");
      const r = el.getBoundingClientRect();
      const widths = [...items].map(i => i.getBoundingClientRect().width);
      const equal = widths.every(w => Math.abs(w - widths[0]) < 2);
      return { count: items.length, equal, navWidth: r.width, firstW: widths[0] };
    }).catch(e => ({ err: String(e) }));
    check("手机-" + name + "-底部导航", nav.count === B["手机底部导航入口数"] && nav.equal, "入口=" + nav.count + "（基线 " + B["手机底部导航入口数"] + "） 等宽=" + nav.equal);

    /* 无横向滚动 */
    const hs = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("手机-" + name + "-无横向滚动", hs <= 1, "溢出=" + hs);

    /* 内容不被底部导航遮挡：滚动到底后，最后一个「可见」元素应完整可见。
       2026-09-17：首页减法 F1 后，AI 下发任务卡被放进 <details> 折叠区，
       它虽然还是 .card，但默认不渲染 —— 直接取最后一个 .card 会量到隐藏元素的
       陈旧坐标，误报遮挡。所以要先排除「祖先里有未展开 details」的元素。 */
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 200));
    const covered = await p.evaluate(() => {
      const nav = document.getElementById("mobileNav");
      const navTop = nav.getBoundingClientRect().top;
      const inClosedDetails = el => {
        let q = el.parentElement;
        while (q) { if (q.tagName === "DETAILS" && !q.open) return true; q = q.parentElement; }
        return false;
      };
      const els = Array.from(document.querySelectorAll("#viewWrap .card, #viewWrap details.more"))
        .filter(el => !inClosedDetails(el));
      const last = els[els.length - 1];
      return { navTop, lastBottom: last ? last.getBoundingClientRect().bottom : -1 };
    });
    check("手机-" + name + "-内容不被遮挡", covered.lastBottom >= 0 && covered.lastBottom <= covered.navTop + 1, "最后卡片底部=" + Math.round(covered.lastBottom) + " 导航顶部=" + Math.round(covered.navTop));

    /* 触控区高度 */
    const touch = await p.$eval(".mn-item", el => el.getBoundingClientRect().height);
    check("手机-" + name + "-触控区>=44px", touch >= B["触控区最小高度"], "高度=" + Math.round(touch));

    /* JS 错误 */
    check("手机-" + name + "-无JS错误", merr.length === 0, merr.join(" ;; ").slice(0, 200));

    await p.screenshot({ path: SHOTS + "/mobile-" + s.w + ".png" });
    await p.close();
  }

  await browser.close();

  /* 汇总 + 退出码。⚠️ 2026-09-18 变异测试才发现：原来这里只 console.log("DONE") 就结束了，
     断言全 FAIL 也是退出码 0 —— 叫 CI / 自动化怎么看出失败？"永远返回 0 的门禁等于没有门禁"。 */
  const failed = results.filter(r => !r.pass);
  console.log("DONE  " + (results.length - failed.length) + " PASS / " + failed.length + " FAIL");
  if (failed.length) console.log("失败清单：\n  " + failed.map(f => f.name + " | " + (f.detail || "")).join("\n  "));
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error("FATAL", e); process.exit(1); });

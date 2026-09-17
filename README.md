# 个人工作台 · workbench

个人学习管理 PWA（考研备考为主）。纯前端、零构建、离线可用：数据存在浏览器 localStorage，通过 Cloudflare 同步到云端，手机「添加到主屏幕」就是一个 App。

**线上**：https://workbench-sync-c9e.pages.dev
**仓库**：`git@github.com:cy852123/workbench.git`（**public**）

> ⚠️ **别把仓库转成 private** —— 2026-09-17 实测：一改成 private，**GitHub Pages 站点就被关掉**（`https://cy852123.github.io/workbench` → 404），而且**改回 public 也不会自动恢复**，必须手动重建（`POST /repos/cy852123/workbench/pages`，source = `main` / `/`）。已当场回滚为 public 并重建 Pages。
> 关键背景：**这个仓库的 GitHub Pages 一直是开着的**，配置是「从 `main` 分支根目录部署」——也就是说**每次 `git push` 都会自动把根目录重新发布一次**，`https://cy852123.github.io/workbench` 就是这个站点（手机上的桌面图标可能指着它）。所以**仓库根目录必须一直保持可运行**（`index.html` 别挪走、别改加载顺序）。
**本机路径**：`E:\Software\workbench`（2026-09-17 从 `C:\Users\Administrator\workbench` 迁到 E 盘）

> ✅ 2026-09-17 维护记录：**线上已更新到本地当前版本**（首次把 `service-worker.js` 一起部署，PWA 离线缓存首次生效）。部署前的状态、命令与自查结果见第六节。

---

## 一、当前状态（2026-09-17）

| 项 | 内容 |
|---|---|
| 入口 | `index.html`（引 `views.js` + `app.js`，无框架、无打包） |
| 核心逻辑 | `app.js` 4500 行 / 285 KB |
| 视图渲染 | `views.js` 2816 行 / 216 KB |
| 样式 | `styles.css` 740 行 / 42 KB |
| 离线 | `service-worker.js`。缓存号当前是 **`wb-cache-v054`**（只此一处写死；改前端必须 +1，跑 `tools/deploy.py` 会**自动**加，别再手抄） |
| 同步 | Cloudflare Pages Functions `/api/data` + KV `WB_KV`（键 `wb_main`） |
| 版本 | 界面里显示 `v0.1.0`；**真实版本看每次提交的说明 + App 内「更新日志」（21 条）** |

## 二、目录结构

```
workbench/
├─ index.html · app.js · views.js · styles.css      前端四件套（**改功能只动这几个**）
├─ service-worker.js · manifest.webmanifest · icon-*.png    PWA（离线 + 装到桌面）
├─ functions/api/*.js       云端接口（随 Pages 一起部署）：data 同步 / ai 代理 / learnpack / tasks
├─ cloudflare-worker.js + wrangler.toml   独立 Worker（名字也叫 workbench-sync，**当前线上没用它**）
├─ gen_dict.py · download_dict.py         词典脚本（见第七节，目前没接进界面）
├─ tools/deploy.py                        **一键部署**：同步暂存 + 缓存号+1 + 上传 + 线上自检（见第六节）
├─ shot_preview.js                        截图脚本：截 previews/ 下某个设计原型页（桌面+手机两张，输出到 previews/）
├─ tests/                  **不入库**：51 个测试脚本（45 个 .js + 6 个 .py）+ 13 个截图/数据文件，共 64 个（见第五节）
├─ previews/               **不入库**：8/16 改版过程的设计预览图/原型页（留档，别删）
├─ _attic/2026-09-17/      **不入库**：本次整理归档的垃圾（.bak 副本、一次性探针、云端快照）
├─ downloads/              **不入库**：测试导出数据落地的地方（导出时会自动生成）
├─ .pages-deploy/          **不入库**：部署暂存目录（上传给 Cloudflare 的就是这里的内容）
├─ .wrangler/              **不入库**：wrangler 本机缓存
├─ ecdict_full.csv · ecdict.zip            **不入库**：66 MB + 5 MB 词典原料
└─ .cf-env · .sync-key.txt                 **不入库、别删**：部署凭据与同步密钥
```

## 三、数据模型（localStorage）

浏览器里只有一个主键，**外加几个自动备份键**：

| localStorage 键 | 说明 |
|---|---|
| `wb_data_v1` | 全部数据（一个 JSON）。结构见下表 |
| `wb_data_v1_backup_<日期>` | 每次「从云端下载」前自动存一份本地备份 |
| `wb_data_v1_preimport_backup` | 每次导入数据前自动备份 |
| `wb_data_v1_pre_reset` | 清空数据前的自动备份 |
| `wb_ai_tasks_done` | 云端下发的 AI 任务打勾记录（独立小键） |

`wb_data_v1` 顶层结构（`v` 是数据结构版本号，加载时 `migrate()` 会做升级）：

| 键 | 类型 | 是什么 |
|---|---|---|
| `v` | 数字 | 结构版本，当前 `1` |
| `meta` | `{created, updated}` | 创建/最后保存时间 |
| `settings` | 对象 | `apiKey/apiBase/apiModel`（AI，当前弃用）、`primaryDomain`（默认领域）、`kaoyanDate`、`background`、`fontSize`、`sync{url,key,auto,lastPush,lastPull}` |
| `domains` | 数组 | 领域（板块）：`kaoyan` 考研备考 / `cet` 英语学习（**已隐藏，数据保留**）/ `ai` AI 知识学习 / `courses` 学业课程 / `paper` 论文写作（`hidden:true`） |
| `grammar` | 对象 | 英语语法专区知识点库 |
| `tasks` | 数组 | 任务（含考研领域内 `schemes[].tasks`） |
| `studyLog` | 数组 | 学习记录（打卡/时长） |
| `mistakes` | 数组 | 错题本 |
| `qa` | 数组 | 答疑库 |
| `resources` | 数组 | 资料库 |
| `inbox` | 数组 | 收集箱（待分拣/已分拣） |
| `reviews` | 数组 | 复盘记录 |
| `calendar` | 数组 | 日历事项（考试/作业/截止） |
| `health` | 对象 | 健康（睡眠/运动等 4 项） |
| `focusSessions` | 数组 | 专注计时（番茄钟）历史 |
| `goals` | 数组 | 目标 |
| `accounts` | 数组 | 账号相关 |
| `deleted` | 数组 | 回收站（删除先落这里，可恢复） |

> 领域内部的细节（考研的 `schemes[].gen`、课程的 `courses/assignments`、论文的 `stages/refs` 等）见 `app.js` 的 `defaultData()`（第 82 行起）—— 那是**唯一的权威结构定义**。

## 四、本地怎么跑

```bash
cd E:\Software\workbench
python -m http.server 8000          # 然后浏览器开 http://127.0.0.1:8000/
```

端口用 **8000**（`tests/` 里的测试脚本写死了 8000，换端口测试会连不上）。
手机同局域网访问：把 `127.0.0.1` 换成电脑的局域网 IP。

## 五、改完必须验证（三条）

```bash
cd E:\Software\workbench

# ① 语法：改完 app.js/views.js 立刻查
node --check app.js && node --check views.js && node --check service-worker.js

# ② UI 冒烟（40 项断言，需要先起 8000 服务；用 Edge/Chrome 无头跑）
npm test                            # = node tests/test.js && node tests/test_interact.js
```

`npm test` 会检查：桌面/手机 3 种宽度渲染、导航项数、卡片数、无横向滚动、触控区 ≥44px、无 JS 报错、任务增删/勾选、搜索、收集箱分拣、番茄钟、回收站……**改动前先跑一遍记下结果，改完再跑一遍对比**，这就是「零回归」的判据。

单独跑某一块（都在 `tests/`，不入库）：

| 脚本 | 看什么 |
|---|---|
| `tests/test.js` | 桌面 + 手机 360/375/390 渲染与布局（无头） |
| `tests/test_interact.js` | 交互：任务/收集箱/搜索/导出/番茄钟/回收站 |
| `tests/test_ky_minimal.js` · `test_ky_subjects.js` | 考研模块 |
| `tests/test_cet_removed.js` · `test_cet_olduser.js` | 英语学习板块移除后的老用户兼容 |
| `tests/test_live_pwa.js` · `test_pwa.js` | PWA / Service Worker |
| `tests/live_desktop.png` · `live_mobile.png` | 最近一次实跑截图 |
| `node shot_preview.js 02-today-A-calm.html` | 给指定的设计原型页截图（需要先起 8000 服务），输出 `previews/shot-02-today-A-calm-desktop.png` / `-mobile.png` |

> 根目录那 7 张 `shot_*.png` 是 **`tests/test.js` 每次跑 `npm test` 时自动重写的**（`tests/test.js` 第 45 行 `page.screenshot({path:"shot_desktop.png"})`）。所以它们是测试产物、不该入库，也**不用手动更新** —— 只要跑一次 `npm test` 就是最新的。

### 补充门禁：`tests/_verify_filelist_crash_independent.js`（2026-09-17 新增）

`npm test` 的 40 项用的是**干净数据**，测不到「已经上传过文件」的路径 —— 而 2026-09-17 那 3 个崩溃恰好只在有上传文件时触发。这个探针专门补这个盲区：

```bash
cd E:\Software\workbench
python -m http.server 8000 --bind 127.0.0.1    # 先起服务
node tests/_verify_filelist_crash_independent.js http://127.0.0.1:8000/          # 本地
node tests/_verify_filelist_crash_independent.js https://workbench-sync-c9e.pages.dev/   # 线上也行
```

它会往 localStorage 里种 3 个「上传过的文件」，然后依次走**政治页 / 专业课页 / 作文模板库弹窗**，13 项断言：不但要求无 JS 报错，还要求**种进去的文件名真的出现在页面上**（渲染中断时必然不出现）。

**怎么证明这个门禁不是「永远通过」的**：拿修复前的旧代码跑一遍必须挂 —— 那份已知会崩的副本留在 `_attic/2026-09-17/prefix-verify/`：

```bash
cd E:\Software\workbench\_attic\2026-09-17\prefix-verify && python -m http.server 8001 --bind 127.0.0.1
cd E:\Software\workbench && node tests/_verify_filelist_crash_independent.js http://127.0.0.1:8001/
# 预期：3/13 通过 + 打印 kyFileListHtml is not defined / fmtSize is not defined，退出码 1
```

> 注意：Python 的 `http.server` 带 `allow_reuse_address`，**同一个端口能在 Windows 上被多个进程同时绑定**，请求随机命中一个 —— 出现莫名其妙的 `ERR_EMPTY_RESPONSE` 时先 `netstat -ano | grep ":8000 "` 看是不是有好几个监听，`taskkill /F /PID <pid>` 清掉再起。

## 五之二、视觉系统（styles.css，2026-09-17 重做）

`styles.css` **开头 5 行的注释就是设计规范，改样式前先读它**。要点：

| 规则 | 说明 |
|---|---|
| 颜色只有 5 类 | 墨 `--ink/--ink-2` ｜ 次级 `--sub/--muted` ｜ 线 `--line/--line-soft` ｜ 底 `--bg/--card/--soft/--chip` ｜ 强调 `--accent`（**全站唯一交互色**）+ 语义 `--ok/--warn/--danger` |
| 模块身份色 `--theme` | 17 个板块**同族低饱和** `hsl(H 45% 36-46%)`，只换色相；白字在各底色均 ≥4.5:1 |
| 字号 / 字重 | 字号走 `--t-display…--t-xs`；**字重只用 2 档**（400 正文 / 650 `--w-strong`）—— 层级靠字号，不靠加粗 |
| 圆角 / 阴影 | 圆角只用 4 档 `--r-sm/md/lg/pill`；阴影只用 2 档 `--shadow-1/2` |
| 层级靠底色分层 | 白 `.card` / `.ky-card` / `.course-card` = **主要内容**；`var(--soft)` 浅底 = 统计块 / 卡内小组件 / 空状态 |
| 图标 | CSS 顶部规范写着"统一 SVG（`ic()` / `W.icons`）"，但**当前界面实际用的是 emoji**（用户 2026-08-16 特意选的「可爱 emoji 风格」）—— **2026-09-17 用户拍板：全站去掉装饰性图标**（原话「图标可以删掉，怎么好看高级怎么来」），层级改由字号 / 字重 / 留白 + 细线承担。做法见下方第四批。功能性命号（关闭 ×）保留 |

**四批改动**（前三批只动 `styles.css`；第四批动了 `views.js` + `app.js`）：

- `b684b1e` 令牌层：17 个荧光模块色 → 同族低饱和；35 处近似灰/阴影/圆角收敛成令牌；字重 800/900 → 650/700；删掉「每页头顶 4px 彩条」和「课程卡顶部色条」；补 `:focus-visible` 焦点环；触控区 22→28px
- `3357ec7` 层级/密度/空状态：白卡 vs 浅底分层；`max-width 1180` 居中；卡间距 20px；列表分隔线降一档；`.empty` 加纯 CSS「空页」图形；手机端反向收紧
- `92f8d5d` 手机端「拥挤」专项（**数据驱动**）：先跑 `node tests/_crowd.js http://127.0.0.1:8000/` 在 390px 下量拥挤度，据此修两处病根 —— ① `views.js` 里 5 处**内联** `font-size:11px/12px`（内联优先级高于样式表，光在 CSS 里覆盖压不住）抬到 12.5px；② 资料库三行筛选加 `.filter-row`，手机端改一行横向滑动；另补手机端 12.5px 最小字号兜底 + 留白放宽。**复测：资料库 <13px 占比 74%→40%，全站再无 11px 文字**
- `020ef08` **第四批 · 去图标**：装饰性图标全站不显示（CSS 隐藏图标位 + `cardHead()` 调用里的图标前缀整体去掉）。同时修掉 3 个真 bug：收集箱类型标签显示英文代码、首页问候语把 `moon` 当文字打出、**69 处卡片标题被 `esc()` 转义成字面 SVG 代码**（用户反馈「有些板块是英语」的就是这个）
- `78ed7ce` + `060c025` **F2 + F1**：侧边栏「工具」按使用频率重排（错题本/专注提前）；首页减法 —— 「hero 卡 + 最底部状态条卡」合并成一张顶部概览卡（3 个 29px 大号 KPI 数字：今日完成率 / 连续打卡 / 本周有效时长），AI 下发任务收进 `<details>` 折叠区，学习领域改紧凑单行。**首屏平级卡 5 张 → 2 张**

**回滚**：`git checkout <上一版hash> -- styles.css`（只改这一个文件）；改完必须 `npm test` 40 项全过 + 人眼比对截图。

## 六、怎么部署（Cloudflare Pages）

- Pages 项目：**`workbench-sync`**，地址 `https://workbench-sync-c9e.pages.dev`（固定域名，手机装的就是它）
- 项目类型：**直传上传**（`wrangler pages project list` 里 Git Provider = No），**不跟 GitHub 联动** —— 也就是说 `git push` 不会自动上线，必须手动部署
- 凭据：`.cf-env`（里面是 `CLOUDFLARE_API_TOKEN`）、`.sync-key.txt`（同步密钥）
- 账号 ID：`2b1d0f8b5fb6631b6d9471ea98cb75f8`

**现在线上是什么版本**（2026-09-17 21:2x 已重新部署）：部署**之前**线上停在 2026-08-16 07:05（提交 `f884293`、SW 缓存号 v048），落后本地 **11 个 commit**（`git log f884293..HEAD`，其中 6 个功能改动：同步部署暂存目录、AI 切微信直连、考研模块极简重构、学科页改造、移除英语学习板块、词典脚本路径随搬迁更新）。本次把 **8 个前端文件（首次包含 `service-worker.js`）+ 4 个 API** 一起传上去，**现在线上 == 本地**。

部署后自查（`curl` 线上 + `md5sum` 本地，逐文件比对，全部一致）：

| 检查 | 结果 |
|---|---|
| `app.js` / `views.js` / `styles.css` / `manifest.webmanifest` / `service-worker.js` | 线上与本地 **md5 完全相同** ✓ |
| `index.html` | 线上 `/index.html` 会 **308 重定向到 `/`**，比 md5 要 `GET /` —— 该 md5 与本地一致 ✓ |
| `/service-worker.js` | **2022 字节、`Content-Type: application/javascript`**（修复前是 3050 字节的 HTML）→ **离线缓存首次真正生效** ✓ |
| `/api/data` | 无密钥 **401**、带密钥 **200** —— 同步接口保护没被破坏 ✓ |
| 真实浏览器打开线上站 | **0 条 console 消息、0 个 JS 错误**，导航 17 项正常 ✓ |
| Service Worker 真的注册上了吗 | ✅ 页面已被 SW 接管（`navigator.serviceWorker.controller` 非空），缓存 `wb-cache-v052` 里躺着 **8 个文件**（`/`、`/index.html`、`/styles.css`、`/views.js`、`/app.js`、`/manifest.webmanifest`、两个图标）✓ |

> **想自己复查 SW 有没有生效**：在线上站按 F12 → Console，粘这段回车，看 `controlled: true` 且 `cachedFiles` 有 8 项即可：
> ```js
> (async()=>{const ks=await caches.keys();const c=await caches.open(ks[0]);return{controlled:!!navigator.serviceWorker.controller,cacheNames:ks,cachedFiles:(await c.keys()).map(r=>r.url.replace(location.origin,''))};})()
> ```

**第一次部署时故意没有把 SW 缓存号 +1**（当时手机从未成功注册过 SW，没有任何旧缓存需要失效）。**第二次部署起照规矩做了：v052 → v053**，「改前端 → 缓存号 +1」从此必须遵守。

**2026-09-17 22:4x 第二次部署（修复三个必崩点）**：第一次部署把 `v0.1.20` 的代码推上线后，才发现里面带着 **3 个「一点就崩」的 bug**（提交 `b663e1e`）——`app.js` 与 `views.js` 各自是 IIFE、作用域互相看不见，却裸调了对方的私有函数：

| 崩在哪 | 现象 | 根因（ReferenceError） |
|---|---|---|
| 政治学科页「知识点资料」 | **传过文件**后整页只渲染 3 张卡就中断 | `kyFileListHtml is not defined` |
| 专业课学科页「章节笔记」 | 同上（3 张卡） | `kyFileListHtml is not defined` |
| 作文模板库弹窗 | **传过模板**后点开是空的 / 根本弹不出 | `fmtSize is not defined` |

修复：`app.js` 自带一份 `fmtSize`、把 `kyFileListHtml` 挂到既有的共享面 `window.W`、views 侧加桥接函数；顺带加固 `save()`（用户点名的 `app.js:386-394`：存前量体积 >3MB 告警、写失败把「⚠️ 未保存」留在侧边栏不消失）。已重新部署，线上自查见下。

线上复验（第二次部署后，全部实测；此后 `tools/deploy.py` 又跑过两次，缓存号现为 v054）：

| 检查 | 结果 |
|---|---|
| 线上/本地 md5 | `app.js`、`views.js`、`styles.css`、`service-worker.js` **逐文件一致** ✓ |
| 线上 SW | 缓存号已升为 **`wb-cache-v053`**，2022 B、`application/javascript` ✓ |
| 线上浏览器 | **0 条 console 消息、0 个 JS 错误**；SW 已接管，`wb-cache-v053` 里有 8 个文件（旧 v052 缓存已被自动清除）✓ |
| **独立探针直接打线上** | **13/13 通过** —— 三个崩溃路径在真实线上站点确认修好 ✓ |
| `/api/data` | 无密钥 **401**（保护未破坏）✓ |

> ⚠️ **重要教训：`npm test` 那 40 项断言覆盖不到上面这三个 bug** —— 它们只在「已经上传过文件」的数据下才触发，而测试用的是干净数据。**这个门禁有盲区。** 为此留了两样东西（都在本地、不入库）：`tests/_verify_filelist_crash_independent.js`（专测这三条路径的探针）和 `_attic/2026-09-17/prefix-verify/`（**修复前**的整站副本，用来证明探针真的会失败 —— 实测修复前 3/13、修复后 13/13）。

部署前后 `cet` 数量对比（部署前线上是旧版、界面上还挂着「英语学习」入口）：

| | 出现次数 `grep -o cet` | 命中行数 `grep -c cet` |
|---|---|---|
| 线上 `app.js`（部署前，8/16 旧版） | 149 | 84 |
| 线上 `app.js`（部署后）= 本地 | 132 | 74 |

⚠️ **本地并没有「删干净」**：这 74 行是 `migrate()` 里的**老用户兼容代码**（把旧 `cet` 领域设 `hidden = true`、修复 `exams`/`wordbook` 的坏结构）加上考研英语的 `cet4`/`cet6` 自动标记。英语学习板块的**界面入口**已移除，但**兼容与数据保留逻辑是故意留的** —— 别当垃圾清掉，清掉老用户数据会炸。

**顺带查出来的问题（2026-09-17 已修复）**：`.pages-deploy/` 里**曾经从来没有 `service-worker.js`**，所以线上 `/service-worker.js` 返回的一直是首页 HTML（3050 字节 = `index.html` 的大小），等于**线上 PWA 的离线缓存从来没生效过**。好处是手机不会卡旧版本；坏处是离线打不开。下面第 1 步的 `cp` 清单里补上了 `service-worker.js`，本次已随部署上线。

**首选：一条命令搞定（2026-09-17 新增 `tools/deploy.py`）**

```bash
cd E:\Software\workbench
python tools/deploy.py            # 前置检查 → 缓存号+1 → 同步暂存 → 上传 → 线上自检
```

它会依次：① 检查仓库是否干净 + `node --check` 三个文件 + 读 `.cf-env`；② 把 `service-worker.js` 的缓存号 **自动 +1**；③ 把 8 个前端文件（**含 `service-worker.js`**）+ `functions/api/*.js` 同步进 `.pages-deploy/`；④ `wrangler pages deploy`；⑤ **逐文件比对线上与本地 `md5`**、核对线上 SW 缓存号、确认 `/api/data` 返回 401、首页 200 —— 任何一项不过就打印回滚指引并以非 0 退出。

```bash
python tools/deploy.py --test        # 部署前先跑 npm test（要 8000 端口空着）
python tools/deploy.py --dry-run     # 只做检查+同步，不真上传（安全试跑）
python tools/deploy.py --no-bump     # 不 +1 缓存号（只有首次上线用得上）
python tools/deploy.py --commit      # 成功后自动提交缓存号那一处改动
```

> 这个脚本就是为下面两个事故写的（`.pages-deploy/` 忘同步、缓存号忘 +1）。**以后改完前端就只跑它**，不要再手抄命令。

下面是它固化的那几步（想看手工流程 / 排障时用）：

重新部署的步骤（改完前端 → 同步暂存目录 → 上传）：

```bash
cd E:\Software\workbench
source .cf-env
export WRANGLER_HOME='E:\Software\workbench\.wrangler'      # 让 wrangler 缓存留在 E 盘
export CLOUDFLARE_ACCOUNT_ID=2b1d0f8b5fb6631b6d9471ea98cb75f8

# 1) 同步前端文件到部署暂存目录（.pages-deploy 不入库，每次部署前手动同步）
cp index.html app.js views.js styles.css service-worker.js manifest.webmanifest icon-192.png icon-512.png .pages-deploy/
#    api 接口（functions/ 有改动时才需要）
cp functions/api/*.js .pages-deploy/functions/api/

# 2) Service Worker 缓存号 +1（跑 tools/deploy.py 会自动做；手改就是把这个数字加 1）
#    当前值看这里：grep -o "wb-cache-v[0-9]*" service-worker.js

# 3) 上传（--branch main 保证覆盖生产环境）
wrangler pages deploy .pages-deploy --project-name workbench-sync --branch main
```

> 这三步本次维护**没有真跑**（上线是要你点头的事，没擅自发布）。已核实的部分：`wrangler` 4.123.0 装在全局（`E:\Software\npm-global`）、`.cf-env` 里的 token 能登录（`wrangler whoami` 成功）、`wrangler pages project list` 能看到 `workbench-sync`、`wrangler pages deploy --help` 确认 `--project-name/--branch` 参数存在。

部署后自查：

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://workbench-sync-c9e.pages.dev/          # 200
curl -s -o /dev/null -w "%{http_code}\n" https://workbench-sync-c9e.pages.dev/api/data  # 401（无密钥，正常）
```

> `cloudflare-worker.js` 是同一套接口的 **Worker 版本**（`wrangler deploy` 部署，KV 绑定 `WB_KV`）。线上前端填的同步地址是 Pages 域名，走的是 `functions/api/`，两者接口一样，**改一个记得另一个也改**。
> 手机不更新时：关掉 PWA 重开，或「设置 → 云端同步 → 下载」一次。

## 七、同步机制

```
手机/电脑浏览器  --(改动后 30 秒防抖, 每天最多 50 次自动上传)-->
   PUT  <同步地址>/api/data   header: X-Sync-Key: <同步密钥>   body: 整个 wb_data_v1 JSON
        ↓
   Cloudflare Pages Function (functions/api/data.js) 校验 X-Sync-Key
        ↓
   KV 命名空间 WB_KV 的 wb_main 键（≤ 20 MB）
```

- 开关在 App 里：**设置与数据 → 云端同步**，填「地址」（`https://workbench-sync-c9e.pages.dev`）+「密钥」（`.sync-key.txt` 里那串），可选开自动同步
- 手动动作：`上传到云端` / `从云端下载`。**下载前会自动把当前本机数据备份**成 `wb_data_v1_backup_<日期>`，下错了能回滚
- 密钥校验是「一把共享密钥」，没有登录系统 —— 所以**密钥不能进仓库**（`.sync-key.txt`、`.cf-env` 都在 `.gitignore` 里）
- 另外三个接口：`/api/ai`（服务端 DeepSeek 代理，密钥在 Pages 环境变量 `DEEPSEEK_KEY`）、`/api/learnpack`（AI 个性化学习包）、`/api/tasks`（AI 下发任务）。后两个由 Hermes 定时任务调用，都读同一个 `X-Sync-Key`

## 八、踩过的坑（别重犯）

**改动类**
- 改了 `app.js`/`views.js`/`styles.css` 之后**一定要把 `service-worker.js` 的缓存号往上加 1**，否则手机 PWA 一直吃旧缓存，看起来像「改了没生效」。**跑 `tools/deploy.py` 会自动 +1**，手动改容易漏（已漏过）
- `index.html` 里 `<script src="views.js">` 在 `app.js` **之前**（views 依赖 `window.W.icons`），别调换顺序
- 事件全靠 `data-action` 委托给 `app.js`（`views.js` 只生成 HTML 字符串，不绑事件）；加按钮要同时在两边写：views 里给 `data-action="xxx"`，app 的委托分支里处理
- 内联 HTML 拼字符串时，用户输入一律过 `esc()`（手机端尤其别漏）
- **`cardHead(标题, ...)` 内部会对标题做 `esc()`，所以别把 HTML（图标、标签）拼进标题字符串**。2026-09-17 就把 `<svg viewBox=...>` 拼进了 69 处标题，结果被转义成字面文字显示在页面上，用户看到一串"英文乱码"反馈「有些板块是英语」。图标要么放标题外面，要么别放。泄漏探针 `tests/_iconleak.js` 现在会拦这类问题
- 首页等页面用 `<details>` 折叠内容时注意：折叠区里的元素虽然还在 DOM 里，但**取坐标会得到隐藏元素的陈旧值**（`tests/test.js` 的"内容不被遮挡"就因此误报过）。量可见性要先排除「祖先里有未展开 details」的元素

**数据类**
- 加载时 `load()` 会跑 `migrate()` 做结构升级（如 `cet.exams` 被写坏成字符串时自动转正、旧日期纠正），**改结构要走 migrate，不要直接改历史数据**
- 删除都进 `deleted`（回收站），别直接 `splice` 掉

**同步类**
- 「云端没有有效数据」= KV 里 `wb_main` 是空或没有 `meta` 字段；先在能用的设备上「上传到云端」再在另一台「下载」
- **用 Python `urllib` 直接读 `/api/data` 会得到 403** —— 那是 Cloudflare 拦掉了 `Python-urllib/x.y` 这个 User-Agent，**不是密钥错**（没密钥才是 401）。写排查脚本请用 `curl`，或自己加一个 `User-Agent` 头，别误判成「密钥失效了」
- 单次上传上限 20 MB（`functions/api/data.js` 里写死）；上传文件（图片/PDF 存 base64）太多会顶到上限

**部署类**
- `.pages-deploy/` 是**手动同步**的旧副本，很容易忘记同步 → 部署出旧版（现在就发生了）
- Pages 项目不连 GitHub：`git push` 只备份代码，**不会**上线（这里说的「上线」指 Cloudflare 那个地址；但 GitHub 自己的 Pages 站点**会**跟着 `git push` 自动更新，见第十节的警告）
- **别把仓库转 private**：实测会关掉 GitHub Pages 站点，且改回 public 不自动恢复（详见第十节）。GitHub Pages 从 `main` 根目录自动部署，所以**根目录必须一直可运行**
- `wrangler pages deploy` 报 **`fetch failed`** 时，先别怀疑 Cloudflare 或令牌 —— 本机 DNS 会解析出 `api.cloudflare.com` 的 IPv6 地址，这条 IPv6 不通时 **Node 的 fetch 直接失败**（curl 会自动回落 IPv4，所以手测 curl 完全正常，极具迷惑性）。解法：`export NODE_OPTIONS=--dns-result-order=ipv4first`。**`tools/deploy.py` 已内置这一行**，走脚本部署不会踩到

## 九、待办

- [x] ~~把本地这 7 个 commit 推到 GitHub~~ ✅ 2026-09-17 完成（`8003f2e..626b90a`）。**注意**：`E:\backup\workbench\` 的备份和项目在**同一块 E 盘**，盘坏了两份一起没，GitHub 才是异地那一份
- [x] ~~把线上更新到当前本地版本（含首次部署 `service-worker.js`）~~ ✅ 2026-09-17 完成，见第六节的部署记录与 md5 自查表
- [ ] **以后每次改前端**必须走完整流程：`cp` 到 `.pages-deploy/` → **SW 缓存号 +1** → `wrangler pages deploy`。漏掉任何一步就会出「改了没生效」或「线上还是旧版」（已发生过一次）——所以下面那条「写 deploy 脚本」优先级很高
- [x] ~~部署流程自动化~~ ✅ 2026-09-17 完成：`tools/deploy.py`（含 `--test/--dry-run/--no-bump/--commit`），已实测跑通
- [ ] `app.js` 4500 行 / `views.js` 2816 行：是否拆模块，见 `OPTIMIZE-PLAN.md`（等你拍板，不擅自大改）
- [ ] 词典脚本 `gen_dict.py` 生成的 `dict.js` 目前**没有任何代码引用**（查词功能没接回界面），66 MB 原料因此白占地方
- [ ] `tests/` 60+ 个脚本没入库：其中真正当回归门禁用的（`test.js`/`test_interact.js`）建议入库，其余 scratch 留在本地
- [ ] **要不要转 private —— 先别转**。2026-09-17 实测：转 private 会**关掉 GitHub Pages**（`https://cy852123.github.io/workbench` 变 404），改回 public 也不自动恢复（已手动重建）。现在状态是 **public**。真要转之前：先确认手机桌面图标用的是不是 Pages 地址，并准备好重建 Pages
- [x] ~~确认 GitHub Pages 站点已恢复~~ ✅ 2026-09-17 完成：http_code **200**，Pages API `status: built`、source = `main` / `/`，且已自动重新部署到修复后的版本（v053）
- [ ] **论文写作领域还是 `hidden:true`**（入口不显示）

## 十、版本控制

- 本地 git 仓库（`main`），远端 `origin` = `git@github.com:cy852123/workbench.git`，提交身份是本仓库私有的 `cy852123 / cy852123@users.noreply.github.com`
- ✅ **2026-09-17 已 `git push origin main`**（`8003f2e..626b90a`），现在与 origin 同步。推送前审计过：**同步密钥与 Cloudflare 令牌在全部历史里出现 0 次**，当前 23 个跟踪文件也无明文——所以 push 是安全的
- **只跟踪 23 个文件**：源码（4 件套 + SW + 图标 + PWA 配置） + `functions/api/` 4 个接口 + Worker + 2 个词典脚本 + `README.md` + `OPTIMIZE-PLAN.md`。产物/凭据/个人数据/测试/截图一律不入库（清单见 `.gitignore`）
- 2026-09-17 做过一次「仓库瘦身」：把 73 个产物类文件（66 MB 词典、部署暂存、设计预览图、个人数据导出）从索引摘除，**磁盘文件一个没删**。要恢复跟踪，直接 `git add .pages-deploy previews ecdict_full.csv ecdict.zip downloads` 再加进 `.gitignore` 白名单即可（文件本来就在磁盘上，不会丢）
- 回滚整棵树：`git reset --hard <提交号>`；只回滚某文件：`git checkout <提交号> -- <文件>`
- 备份（都在 E 盘）：
  - `E:\backup\workbench\workbench-20260917.tar.gz`（搬迁前的整树，含大词典与 .git）
  - `E:\backup\workbench\workbench-before-maintain-20260917.tar.gz`（本次整理前的整树）
  - `E:\backup\workbench\uncommitted-tracked-20260917.diff`（本次整理前那批未提交改动的完整 diff）

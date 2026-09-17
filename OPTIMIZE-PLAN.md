# workbench 优化方案（2026-09-17）

> **这份文件只写"该改什么、为什么、怎么验证"，代码一行没动**（除了第一阶段允许的那三件事）。
> 你点头以后，再按第五节的分批顺序执行 —— 每批都能单独回滚。

---

## 0. 先说结论：现在最该做的三件事

| 顺序 | 事情 | 为什么急 | 风险 |
|---|---|---|---|
| **1** | **把线上更新一次**（并把 `service-worker.js` 一起部署） | 你手机上那个 App 现在跑的是 8/16 07:05 的旧版：没有「学科页改造」「英语学习板块移除」这些你已经提交的改动。**你每天在用的其实不是你以为的那版** | 低（部署脚本可回滚：Pages 控制台可回滚到上一次部署） |
| **2** | **确认数据兜底**：打开自动同步 + 手动导出一次备份 | 数据只活在浏览器 localStorage 里。那一份云端快照里 `sync.auto` 是 **false**（自动同步没开）。换手机/清缓存/存满 → 全没了 | 极低（导出就是下载一个 JSON） |
| **3** | **写一个 `deploy` 脚本**（同步暂存 + 缓存号+1 + 上传 + 自检） | 现在部署靠手抄 4 条命令，已经出过一次事故（见下面 P0-1 的证据） | 低（新增文件，不动现有代码） |

---

## 1. 实测基线（后面所有判断都基于这些数字）

| 项 | 实测值 | 怎么测的 |
|---|---|---|
| 核心文件 | `app.js` 4500 行 / 285 KB；`views.js` 2816 行 / 216 KB；`styles.css` 740 行 / 42 KB | `wc -l`、`ls -l` |
| 仓库跟踪文件 | 23 个（本次瘦身前 95 个） | `git ls-files \| wc -l` |
| UI 回归现状 | `npm test` = **40 项断言全过**（桌面+手机 3 种宽度+交互） | 真跑，见下 |
| 线上版本 | 落后本地 **11 个 commit**（`git log f884293..HEAD`，其中 6 个功能改动）；线上 `app.js` 里 `cet` 命中 **84 行 / 149 处**（本地 74 行 / 132 处，均为 migrate 兼容代码） | 下载线上文件比对 md5 + `grep -c cet` / `grep -o cet` |
| 线上 Service Worker | **不存在**（请求 `/service-worker.js` 返回 3050 字节 = `index.html` 的大小） | `curl` + md5 比对 |
| 云端数据 | KV `WB_KV` 里 3 个键：`wb_main`（主数据）、`wb_tasks`、`wb_learnpack`；单次上限 20 MB | Cloudflare API 只读查询 |
| 数据规模 | 主数据 JSON 约 11 KB（云端快照实测） | 快照文件大小 |
| 上传文件上限 | 每个文件 2 MB，**以 base64 形式塞进主数据**（`app.js:790 KY_FILE_MAX`） | 读代码 |
| 保存失败处理 | `localStorage` 写失败只弹「保存失败：浏览器存储空间可能已满」，**改动不落盘**（`app.js:386-394`） | 读代码 |

> 2026-09-17 21:1x 独立复核（另起一次会话重跑）：`npm test` 仍 **40/40 通过**（test.js 26 项 + test_interact.js 14 项）；上表各行逐一核对过代码或线上实测 —— `KY_FILE_MAX` 确在 `app.js:790`、`esc(` 在 `views.js` 出现 351 处、`WB_DICT` 零引用（词典链路确实悬空）、`defaultData()` 在 `app.js:82`、`views.js:2645` 写死 `v0.1.0`、`service-worker.js` 里是 `wb-cache-v052`、`tests/test.js` 确实往仓库根目录写 `shot_*.png`。

---

## 2. 问题清单（按优先级）

### P0 —— 影响你现在就在用的东西

| # | 类别 | 问题 | 证据 | 影响 |
|---|---|---|---|---|
| **P0-1** | 正确性/UX | **线上是旧版**：Pages 项目不连 GitHub（Git Provider = No），`git push` 不会上线；而部署靠手动把文件 `cp` 到 `.pages-deploy/` 再上传，很容易漏 | 线上 `app.js` md5 ≠ 本地；线上 `cet` 149 处 / 84 行（本地 132 处 / 74 行，是 migrate 兼容代码）；`wrangler pages project list` 显示 workbench-sync 是直传项目 | 你在手机上看到的功能和你改的代码不一致，会误以为"改了没生效" |
| **P0-2** | 正确性 | **`.pages-deploy/` 里从来没有 `service-worker.js`** → 线上离线/PWA 缓存机制从未生效（也就没有"新版本提示刷新"） | 请求线上 `/service-worker.js` 得到 3050 B，md5 = 本地 `index.html` | ① 断网打不开；② 以后一旦把 SW 补上线，就必须遵守"改前端 → 缓存号 +1"，否则手机锁在旧版 |
| **P0-3** | 数据安全 | **只有 localStorage，没有定期备份**；云端快照里 `sync.auto = false`，而且**云端主数据停在 2026-08-16 05:15**（之后没成功上传过） | 实测 `curl -H "X-Sync-Key: …" .../api/data` 返回 `meta.updated = "2026-08-16 05:15"`；快照 `settings.sync.auto=false` | 清浏览器数据 / 换手机 / 存储写满 → 全部学习记录消失；两台设备数据也在各自漂移 |
| **P0-4** | 正确性 | **上传文件 = base64 进 localStorage**：2 MB 上限 × 2~3 个文件就可能把 localStorage（一般 5~10 MB）撑满，之后所有保存静默失败 | `app.js:790`（上限）、`app.js:386-394`（失败只弹提示） | 撑满后你以为保存了，其实没存 → 数据丢失，且现象难查 |
| **P0-5** | 安全 | 仓库是 **public**，历史里已经有个人数据导出文件（`downloads/工作台备份_2026-08-16.json`，含课程/错题/答疑等记录；**已确认不含同步密钥、不含 API 密钥**） | GitHub API：`"private": false`；`git log -S<密钥>` 为空 | 隐私暴露；也提醒以后别把 `data_tmp.json` 这类文件误提交 |

### P1 —— 结构性的，需要小步做

| # | 类别 | 问题 | 证据 | 影响 |
|---|---|---|---|---|
| **P1-1** | 可维护性 | **没有一条"一键验证"**：`tests/` 60+ 个脚本不入库、无基线文件、没有回归门禁 | `tests/` 在 `.gitignore` 里；`package.json` 的 `test` 只跑 2 个脚本 | 改完不知道有没有改坏别处；换电脑/重装就丢了整套测试 |
| **P1-2** | 可维护性 | **Service Worker 缓存号靠手改**、App 内版本号写死 `v0.1.0`（真实已经到 v0.1.20+） | `service-worker.js` 里硬编码 `wb-cache-v052`；`views.js:2645` 写死 v0.1.0 | 版本号不敢信；漏改缓存号会让手机吃旧缓存 |
| **P1-3** | 正确性 | **同步是"最后写入赢"，没有冲突处理**：两台设备都改了，后上传的整份覆盖前一份（下载前有本地备份，能救但不易发现） | `app.js:441-449`（`Object.assign` 整份替换）；`syncPush` 传整个 data | 手机和电脑同时用会互相覆盖 |
| **P1-4** | 可维护性 | **单文件过大**：`app.js` 4500 行一个 IIFE、`views.js` 2816 行 | `wc -l` | 定位改动慢、冲突多、新功能只能堆在同一个文件里 |
| **P1-5** | 正确性 | 仓库历史仍背着 66 MB 词典与 300 KB+ 的截图（瘦身只摘了索引，历史里还在） | GitHub API `"size": 39400`（KB） | clone 慢；不影响使用，纯浪费 |
| **P1-6** | UX | 自动同步静默失败：`syncPush(true)` 失败不提示 | `app.js:410-424`，`if (!silent) toast(...)` | 你以为云上是新的，其实停在几天前 |

### P2 —— 打磨，不急

| # | 类别 | 问题 | 证据 |
|---|---|---|---|
| **P2-1** | 可维护性 | `innerHTML` 拼接太多：`app.js` 28 处、`views.js` 全量拼字符串；样式内联（`style="..."`）散在各处 | `grep -c innerHTML`；`views.js` 里大量 `style=` |
| **P2-2** | 安全 | 视图层基本都过了 `esc()`（351 处），但 `app.js` 那 28 处 `innerHTML` 没系统过一遍；上传的图片走 `data:` URL | `grep -c 'esc(' views.js` = 351 |
| **P2-3** | 可维护性 | 词典链路悬空：`gen_dict.py` → `dict.js`，但**没有任何代码引用 `window.WB_DICT`** | `grep WB_DICT app.js views.js` 无结果 |
| **P2-4** | 可维护性 | 根目录脚本与代码混放（`gen_dict.py`、`download_dict.py`、`shot_preview.js` 三个） | `ls` |
| **P2-5** | UX | App 内「更新日志」要手动写字条（20 条都是手写 HTML），和 commit 说明重复劳动 | `views.js:2653` 起 |
| **P2-6** | 安全 | `/api/data` 用一把共享密钥 + `Access-Control-Allow-Origin: *`，无频率限制；密钥一旦泄露（比如误提交）别人能覆盖你的数据 | `functions/api/data.js`、`cloudflare-worker.js` |

---

## 3. 每项怎么做（改动范围 / 风险 / 验证 / 回滚）

### P0-1 + P0-2：更新线上（一次做完）

**改动范围**：只动 `.pages-deploy/`（产物目录）+ 部署动作。源码不动。
**步骤**：
```bash
cd E:\Software\workbench
source .cf-env
export WRANGLER_HOME='E:\Software\workbench\.wrangler'
export CLOUDFLARE_ACCOUNT_ID=2b1d0f8b5fb6631b6d9471ea98cb75f8
# 1) 同步前端 8 个文件（★ 这次补上 service-worker.js）
cp index.html app.js views.js styles.css service-worker.js manifest.webmanifest icon-192.png icon-512.png .pages-deploy/
cp functions/api/*.js .pages-deploy/functions/api/
# 2) 缓存号 +1：service-worker.js 里 wb-cache-v052 → v053
# 3) 上传
wrangler pages deploy .pages-deploy --project-name workbench-sync --branch main
```
**风险**：中低。这是一次真实上线，会改变你手机上的界面。
**→ 建议**：先在一台设备上试；**先在浏览器里用 `python -m http.server 8000` 看一遍本地版**（本地已经是新代码），确认没问题再上线。
**验证**：
```bash
curl -s https://workbench-sync-c9e.pages.dev/service-worker.js | grep -o 'wb-cache-v[0-9]*'   # 应打印 wb-cache-v053
curl -s https://workbench-sync-c9e.pages.dev/app.js | grep -c cet                            # 应为 0
```
**回滚**：Cloudflare 控制台 → Pages → workbench-sync → Deployments → 选上一次 → "Rollback"。

### P0-3：数据兜底（5 分钟）

**做什么**：① App 里「设置与数据 → 云端同步」确认地址+密钥，**勾上自动同步**；② 手动点一次「上传到云端」；③ 顺手「导出数据」存一份到 E 盘；④ 以后每月导出一次。
**验证**：`curl -H "X-Sync-Key: <密钥>" https://workbench-sync-c9e.pages.dev/api/data | head -c 200` 应返回带 `meta` 的 JSON。
**风险**：无。**回滚**：不需要。

### P0-4：上传文件的容量风险

**三条路，选一条（建议 A）**：
- **A（推荐，改动小）**：上传文件不再进主数据，改存 IndexedDB（浏览器给到几百 MB），主数据只存"文件名 + 文件大小 + IndexedDB 的 key"。数据模型加一层，但 `wb_main` 同步体积不变（**代价：文件不会同步到手机**，需要单独传）。
- **B（最省事）**：保留现状，但加上"容量水位"提示：主数据超过 3 MB 时警告、超过 4 MB 拒绝上传并提示先清理。
- **C**：图片上传前压缩（canvas 缩到长边 1600px / JPEG 0.8），只对大图有效。
**改动范围**：`app.js` 文件组件（`app.js:789` 起）+ `views.js` 文件展示部分。
**风险**：中（改的是数据存储方式，必须写 migrate 兼容旧数据）。
**验证**：上传 3 个 2 MB 文件后 `JSON.stringify(data).length` 与 `localStorage` 写入是否成功；再跑 `npm test`。
**回滚**：`git revert`（migrate 要写成"只加不改"，旧数据可读）。

### P0-5：公开仓库里的历史个人数据

**两条路**：
- **A（推荐，最省心）**：把仓库改成 **private**（GitHub → Settings → General → Danger Zone → Change visibility）。历史里的数据就外人看不到了。
- **B（彻底）**：用 `git filter-repo` 把 `downloads/` 从全部历史里删掉并强推。**风险高**（重写历史、需要重新 clone），而且公开期间可能已被索引，收益有限。
**改动范围**：只有 A 是零代码改动。
**验证**：`curl -s https://api.github.com/repos/cy852123/workbench | grep '"private"'` → `true`。

### P1-1：回归门禁（把验证变成一条命令）

**做什么**：
1. `.gitignore` 里把 `tests/` 从"整目录忽略"改成"只忽略 scratch"（忽略 `tests/_*.js`、`tests/*.png`、`tests/wechat_sim.json`），**把真正当门禁的脚本入库**：`test.js`、`test_interact.js`、`test_ky_*.js`、`test_cet_*.js`。
2. 新建 `tests/baseline.json`，把会随数据/版本变的数字集中一处（导航项数、卡片数、任务数、测试通过项数）。
3. `package.json` 加脚本：`npm run verify` = `node --check` 三个文件 + 起服务 + 跑全部测试 + 打印"通过 N 项"。
4. 门禁只读（不写文件、不删文件）—— 现在 `tests/test.js` 会**写根目录 7 张 shot_*.png**，改为写到 `tests/` 下。
**风险**：低（新增+挪脚本，不改 app 代码）。注意"不要挪动脚本位置"的纪律：只新增 `run_verify.js`，现有测试脚本位置不动。
**验证**：`npm run verify` 应打印 `PASS 40/40`；然后**故意改坏一处**（把 `views.js` 里某个标题改错）再跑，必须变红 —— 证明门禁真能失败。
**回滚**：`git revert`。

### P1-2：版本号单一来源

**做什么**：`app.js` 顶部加 `var APP_VERSION = "0.1.21";`，侧边栏 `sideVer` 显示它；`service-worker.js` 的 `CACHE` 改成 `"wb-cache-v" + 版本号`（或用一个 `version.js` 同时给两边）。再写 10 行的 `bump_version.py`：改一处 + 自动替换 `?v=N`。
**风险**：低。**验证**：改版本号 → 侧边栏跟着变 → `npm test` 仍全过。

### P1-3：同步冲突

**做什么（最简可行）**：`syncPush` 前先 GET 云端 `meta.updated`，若比本地新 → 弹出「云端更新（时间），要先下载合并吗？」，给"覆盖云端 / 先下载 / 取消"三个选择；默认不静默覆盖。
**风险**：中（改同步流程）。**验证**：两个浏览器窗口（或一个窗口+一个无痕）分别改数据，观察是否提示。

### P1-4：拆不拆 `app.js`/`views.js` —— **这一项请你拍板**

**方案 A（不拆，先稳住）**：保持单文件，只在文件内加分区注释 + 目录（用 `grep -n '^  /\* -'` 就能跳）。成本 0，收益 0，风险 0。
**方案 B（按视图拆 views.js，1~2 天）**：`views.js` 拆成 `views/` 下 8~10 个文件（今日/考研/课程/资料库/错题本/答疑/复盘/设置…），`index.html` 多引几个 `<script>`。**不需要构建工具**（浏览器原生多文件），但要按依赖顺序列 script 标签，且 SW 的 `ASSETS` 清单要同步更新。
**方案 C（真模块化，用 ES Module，3~5 天）**：改成 `import/export` + `type="module"`，`app.js` 拆成 store/sync/migrate/actions/render。收益最大，但要动 `index.html` 加载方式、SW 缓存清单、所有测试的注入方式。
**我的建议**：**先做 A + P1-1 + P1-2**；等你哪天要加"新模块"时再做 B（拆的时候顺手把新模块独立出去）。**C 现在不值得**——没有构建需求，收益主要是"好看"。
**无论选哪个，验证方式一致**：`npm test` 40 项全过 + 桌面/手机截图人眼比对。

### P1-5：仓库历史瘦身（可选）

**做什么**：`git filter-repo --path ecdict_full.csv --path ecdict.zip --path previews --path .pages-deploy --invert-paths` 然后强推。
**风险**：**高**（重写历史、所有 commit 哈希变化、本地要重新 clone）。**收益**：clone 从 45 MB 降到几 MB。
**建议**：先不做。等哪天需要在新电脑上 clone 再说。

### P1-6：同步失败要说话

**做什么**：`syncPush(true)` 失败时，在侧边栏底部把「已保存 hh:mm」改成「⚠️ 未同步 hh:mm（点击重试）」。**风险**：低。
**验证**：把同步地址改错 → 改一条数据 → 侧边栏应出现警告。

### P2 组：见第 2 节表格，改动都很小，随功能迭代顺手做

---

## 4. 需要你拍板的 4 个决策点

1. **要不要更新线上？**（P0-1/P0-2；我建议要，且建议先本地看一眼新版本再上线）
2. **`app.js`/`views.js` 拆不拆？** 选 A / B / C（我建议 A 或 B，不建议 C）
3. **仓库要不要转 private？**（P0-5；我建议转，零成本）
4. **上传文件要不要改存 IndexedDB？**（P0-4；代价是"文件不再自动同步到手机"）

---

## 5. 建议的执行顺序（每批都能单独回滚）

| 批次 | 内容 | 预计 | 回滚方式 |
|---|---|---|---|
| 第 1 批 | P0-3 数据兜底（App 内操作，不涉及代码） | 5 分钟 | 不需要 |
| 第 2 批 | P0-1 + P0-2 更新线上（含 SW） | 15 分钟 | Pages 控制台 Rollback |
| 第 3 批 | P0-5-A 仓库转 private | 1 分钟 | 改回 public |
| 第 4 批 | P1-1 回归门禁 + P1-2 版本号单一来源 | 半天 | `git revert` |
| 第 5 批 | 写 `deploy` 脚本（把第 2 批那 3 步固化成一条命令 + 自检） | 半天 | 删脚本即可，部署仍可手动 |
| 第 6 批 | P0-4 上传容量（选 A/B/C）+ P1-6 同步提示 | 1 天 | `git revert` |
| 第 7 批 | 按决策拆文件 / 其余 P2 | 视选择 | 按批 revert |

---

## 6. 明确**不建议**做的事

- ❌ 不要为了"看起来现代"引入打包器（Vite/webpack）—— 现在零构建、改完刷新就生效，这正是它手机端最省事的地方。
- ❌ 不要动 `app.js`/`views.js` 的文件名和 `index.html` 的加载顺序（`views.js` 必须在 `app.js` 前），除非按 P1-4 方案 B/C 整批做。
- ❌ 不要删 `_attic/`、`previews/`、`tests/`、`downloads/`（都不入库，但都是你的资产）。
- ❌ 不要为了瘦身去 `git filter-repo`（历史重写风险 > 收益），除非要换电脑重新 clone。

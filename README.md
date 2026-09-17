# 个人工作台 · workbench

个人学习管理 PWA（考研备考为主）。纯前端、零构建、离线可用：数据存在浏览器 localStorage，通过 Cloudflare 同步到云端，手机「添加到主屏幕」就是一个 App。

**线上**：https://workbench-sync-c9e.pages.dev
**仓库**：`git@github.com:cy852123/workbench.git`（public）
**本机路径**：`E:\Software\workbench`（2026-09-17 从 `C:\Users\Administrator\workbench` 迁到 E 盘）

> ⚠️ 2026-09-17 维护记录：**线上还是 8/16 07:05 的旧版**（没有 8/16 之后的「英语学习板块移除、学科页改造」等改动）。原因和部署命令见第六节。

---

## 一、当前状态（2026-09-17）

| 项 | 内容 |
|---|---|
| 入口 | `index.html`（引 `views.js` + `app.js`，无框架、无打包） |
| 核心逻辑 | `app.js` 4500 行 / 285 KB |
| 视图渲染 | `views.js` 2816 行 / 216 KB |
| 样式 | `styles.css` 740 行 / 42 KB |
| 离线 | `service-worker.js`（缓存号 `wb-cache-v052`，改完前端要 +1） |
| 同步 | Cloudflare Pages Functions `/api/data` + KV `WB_KV`（键 `wb_main`） |
| 版本 | 界面里显示 `v0.1.0`；**真实版本看每次提交的说明 + App 内「设置与数据 → 更新日志」（20 条）** |

## 二、目录结构

```
workbench/
├─ index.html · app.js · views.js · styles.css      前端四件套（**改功能只动这几个**）
├─ service-worker.js · manifest.webmanifest · icon-*.png    PWA（离线 + 装到桌面）
├─ functions/api/*.js       云端接口（随 Pages 一起部署）：data 同步 / ai 代理 / learnpack / tasks
├─ cloudflare-worker.js + wrangler.toml   独立 Worker（名字也叫 workbench-sync，**当前线上没用它**）
├─ gen_dict.py · download_dict.py         词典脚本（见第七节，目前没接进界面）
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

## 六、怎么部署（Cloudflare Pages）

- Pages 项目：**`workbench-sync`**，地址 `https://workbench-sync-c9e.pages.dev`（固定域名，手机装的就是它）
- 项目类型：**直传上传**（`wrangler pages project list` 里 Git Provider = No），**不跟 GitHub 联动** —— 也就是说 `git push` 不会自动上线，必须手动部署
- 凭据：`.cf-env`（里面是 `CLOUDFLARE_API_TOKEN`）、`.sync-key.txt`（同步密钥）
- 账号 ID：`2b1d0f8b5fb6631b6d9471ea98cb75f8`

**现在线上是什么版本**：最后一次部署是 2026-08-16 07:05（提交 `f884293`，SW 缓存号 v048）。之后本地又提交了 **11 个 commit**（`git log f884293..HEAD`；其中 6 个是功能改动：同步部署暂存目录、AI 切微信直连、考研模块极简重构、学科页改造、移除英语学习板块、词典脚本路径随搬迁更新），**线上落后于本地**。

实测对比（`curl` 线上 `app.js` + 读本地文件，同样搜 `cet`）：

| | 出现次数 `grep -o cet` | 命中行数 `grep -c cet` |
|---|---|---|
| 线上 `app.js` | 149 | 84 |
| 本地 `app.js` | 132 | 74 |

⚠️ **本地并没有「删干净」**：这 74 行是 `migrate()` 里的**老用户兼容代码**（把旧 `cet` 领域设 `hidden = true`、修复 `exams`/`wordbook` 的坏结构）加上考研英语的 `cet4`/`cet6` 自动标记。英语学习板块的**界面入口**已移除，但**兼容与数据保留逻辑是故意留的** —— 别当垃圾清掉，清掉老用户数据会炸。

**顺带查出来的问题**：`.pages-deploy/` 里**从来没有 `service-worker.js`**，所以线上 `/service-worker.js` 实际返回的是首页 HTML（实测：请求它拿到 3050 字节，正好等于 `index.html` 的大小），等于**线上的离线缓存、装到桌面的 PWA 缓存机制从来没生效过**。好处是手机不会卡旧版本；坏处是离线打不开、也没有「新版本提示刷新」。下面第 1 步的 `cp` 清单里我补上了 `service-worker.js`。

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

# 2) Service Worker 缓存号 +1（不 +1 手机会继续吃旧缓存）
#    改 service-worker.js 里的 "wb-cache-v052" → v053

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
- 改了 `app.js`/`views.js`/`styles.css` 之后**一定要把 `service-worker.js` 的 `wb-cache-v052` 往上加 1**，否则手机 PWA 一直吃旧缓存，看起来像「改了没生效」
- `index.html` 里 `<script src="views.js">` 在 `app.js` **之前**（views 依赖 `window.W.icons`），别调换顺序
- 事件全靠 `data-action` 委托给 `app.js`（`views.js` 只生成 HTML 字符串，不绑事件）；加按钮要同时在两边写：views 里给 `data-action="xxx"`，app 的委托分支里处理
- 内联 HTML 拼字符串时，用户输入一律过 `esc()`（手机端尤其别漏）

**数据类**
- 加载时 `load()` 会跑 `migrate()` 做结构升级（如 `cet.exams` 被写坏成字符串时自动转正、旧日期纠正），**改结构要走 migrate，不要直接改历史数据**
- 删除都进 `deleted`（回收站），别直接 `splice` 掉

**同步类**
- 「云端没有有效数据」= KV 里 `wb_main` 是空或没有 `meta` 字段；先在能用的设备上「上传到云端」再在另一台「下载」
- **用 Python `urllib` 直接读 `/api/data` 会得到 403** —— 那是 Cloudflare 拦掉了 `Python-urllib/x.y` 这个 User-Agent，**不是密钥错**（没密钥才是 401）。写排查脚本请用 `curl`，或自己加一个 `User-Agent` 头，别误判成「密钥失效了」
- 单次上传上限 20 MB（`functions/api/data.js` 里写死）；上传文件（图片/PDF 存 base64）太多会顶到上限

**部署类**
- `.pages-deploy/` 是**手动同步**的旧副本，很容易忘记同步 → 部署出旧版（现在就发生了）
- Pages 项目不连 GitHub：`git push` 只备份代码，**不会**上线

## 九、待办

- [ ] **把本地这 7 个 commit 推到 GitHub**：`git push origin main`。现在整份整理成果只在本机，而 `E:\backup\workbench\` 的备份**和项目在同一块 E 盘** —— 盘坏了两份一起没。推到 GitHub 是成本最低的异地备份（仓库当前的 private/public 状态见下面 P0-5）
- [ ] **把线上更新到当前本地版本**（见第六节；线上还停在 8/16 07:05）
- [ ] 部署流程自动化：写个 `deploy` 脚本把「同步暂存 + SW 版本号 +1 + 上传 + 自检」一次做完（现在靠手抄，已出过一次事故）
- [ ] `app.js` 4500 行 / `views.js` 2816 行：是否拆模块，见 `OPTIMIZE-PLAN.md`（等你拍板，不擅自大改）
- [ ] 词典脚本 `gen_dict.py` 生成的 `dict.js` 目前**没有任何代码引用**（查词功能没接回界面），66 MB 原料因此白占地方
- [ ] `tests/` 60+ 个脚本没入库：其中真正当回归门禁用的（`test.js`/`test_interact.js`）建议入库，其余 scratch 留在本地
- [ ] 论文写作领域还是 `hidden:true`（入口不显示）

## 十、版本控制

- 本地 git 仓库（`main`），远端 `origin` = `git@github.com:cy852123/workbench.git`，提交身份是本仓库私有的 `cy852123 / cy852123@users.noreply.github.com`
- ⚠️ **2026-09-17 实测：本地领先远端 7 个 commit（`git status -sb` 显示 `ahead 7`），还没 push** —— 远端 HEAD 仍是 `8003f2e`（8/16 09:08）。也就是说**这本手册、`OPTIMIZE-PLAN.md`、仓库瘦身、词典脚本路径更新，全都只存在这台电脑上**
- **只跟踪 23 个文件**：源码（4 件套 + SW + 图标 + PWA 配置） + `functions/api/` 4 个接口 + Worker + 2 个词典脚本 + `README.md` + `OPTIMIZE-PLAN.md`。产物/凭据/个人数据/测试/截图一律不入库（清单见 `.gitignore`）
- 2026-09-17 做过一次「仓库瘦身」：把 73 个产物类文件（66 MB 词典、部署暂存、设计预览图、个人数据导出）从索引摘除，**磁盘文件一个没删**。要恢复跟踪，直接 `git add .pages-deploy previews ecdict_full.csv ecdict.zip downloads` 再加进 `.gitignore` 白名单即可（文件本来就在磁盘上，不会丢）
- 回滚整棵树：`git reset --hard <提交号>`；只回滚某文件：`git checkout <提交号> -- <文件>`
- 备份（都在 E 盘）：
  - `E:\backup\workbench\workbench-20260917.tar.gz`（搬迁前的整树，含大词典与 .git）
  - `E:\backup\workbench\workbench-before-maintain-20260917.tar.gz`（本次整理前的整树）
  - `E:\backup\workbench\uncommitted-tracked-20260917.diff`（本次整理前那批未提交改动的完整 diff）

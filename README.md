# 个人工作台 · workbench

个人学习管理 PWA（考研备考为主）。纯前端、零构建、离线可用：数据存在浏览器 localStorage，通过 Cloudflare 同步到云端，手机「添加到主屏幕」就是一个 App。

**线上**：https://workbench-sync-c9e.pages.dev
**仓库**：`git@github.com:cy852123/workbench.git`（**public**）

> ⚠️ **别把仓库转成 private** —— 2026-09-17 实测：一改成 private，**GitHub Pages 站点就被关掉**（`https://cy852123.github.io/workbench` → 404），而且**改回 public 也不会自动恢复**，必须手动重建（`POST /repos/cy852123/workbench/pages`，source = `main` / `/`）。已当场回滚为 public 并重建 Pages。
> 关键背景：**这个仓库的 GitHub Pages 一直是开着的**，配置是「从 `main` 分支根目录部署」——也就是说**每次 `git push` 都会自动把根目录重新发布一次**，`https://cy852123.github.io/workbench` 就是这个站点（手机上的桌面图标可能指着它）。所以**仓库根目录必须一直保持可运行**（`index.html` 别挪走、别改加载顺序）。
**本机路径**：`E:\Software\workbench`（2026-09-17 从 `C:\Users\Administrator\workbench` 迁到 E 盘）

> ✅ 2026-09-17 维护记录：**线上已更新到本地当前版本**（首次把 `service-worker.js` 一起部署，PWA 离线缓存首次生效）。部署前的状态、命令与自查结果见第六节。

---

## 🧭 产品定位（2026-09-18 重大变更 —— 接手先读这节）

**网页端 = 配合 Hermes（电脑端 AI）的「查看端」**。用户 2026-09-18 明确定位：

> 网页端只负责**看和勾**，一切**录入**都发给 Hermes。

据此做了四组改动（全部已上线，当前缓存号 **v068**）：

| 组 | 改动 | commit |
|---|---|---|
| A | 删掉「手机本身就有且更方便」的 5 个板块：专注/番茄钟、目标、健康、日历、账号 | `7615c3c` |
| B | 删掉与 Hermes 重复的：网页 AI 帮手、语法检查器、口语专区、答疑库（本来就无入口的孤儿页）、时政收藏夹、AI 生成类按钮 | `7615c3c` |
| C | 删掉全部手动录入入口（24 类、约 40 处），只留勾选/打卡/复习评分/分拣/删除/搜索/同步/导入导出/配置 | `7845f91` `19cc393` |
| D | 新增「今日复习队列」（首屏）+「Hermes」板块（资料流 + 周报月报） | `dfe699b` `5adcf33` |

**导航现状（12 项）**：今日 / **Hermes** / 考研备考 / AI 知识学习 / 学业课程 / 错题本 / 学习记录 / 复盘 / 资料库 / 收集箱 / 搜索 / 设置与数据
**手机底部导航（4 项）**：今日 / 考研备考 / **错题本** / 更多

### ⚠️ 数据一个都没删
A/B/C 三组只删**界面入口**。数据字段（`d.goals`、`d.health`、`d.calendar`、`d.accounts`、`d.mistakes` 等）原样保留，随时可恢复。

### 怎么恢复某个录入入口
改 `app.js` 的 `MANUAL_INPUT_ACTIONS` 数组 —— **把某一项删掉，那个「＋新增」按钮就回来了**。
> 实现方式：渲染完成后按 `data-action` 移除按钮，而不是改 HTML 模板。
> **原因（踩坑记录）**：模板里有大量动态拼接（如 `data-domain="' + esc(dm.id) + '"`），
> 用正则批量删按钮会**切坏 JS 字符串**（实测报 `SyntaxError: Invalid or unexpected token`）。
> 详见 commit `7845f91` 的提交说明。

### Hermes 写入通道（2026-09-18 新增）
`functions/api/store.js` —— 白名单 key 的 KV 读写，供 Hermes 往网页端推内容：

```bash
BASE=https://workbench-sync-c9e.pages.dev
KEY=$(cat .sync-key.txt)
curl -s -H "X-Sync-Key: $KEY" "$BASE/api/store?key=feed"                       # 读资料流
curl -s -X PUT -H "X-Sync-Key: $KEY" --data-binary @feed.json "$BASE/api/store?key=feed"   # 写
```

- 白名单：`key=feed`（资料流）、`key=report`（周报月报）。**非法 key 返回 400**；无密钥 401
- 数据格式：`{"items":[{"id","date","type","title","body"}]}`
- 网页端进「Hermes」板块时自动拉取（`hermesPull()`，同 `aiLearnPull` 模式：只读、失败静默）
- 用户点「标记掌握」的状态存在 `d.hermes.done`，跟着 `/api/data` 一起同步，换设备不丢

---

## 一、当前状态（2026-09-18 复核）

| 项 | 内容 |
|---|---|
| 入口 | `index.html`（引 `views.js` + `app.js`，无框架、无打包） |
| 核心逻辑 | `app.js` 4657 行 / 289 KB |
| 视图渲染 | `views.js` 2874 行 / 218 KB |
| 样式 | `styles.css` 1262 行 / 70 KB。**0 处 hex 硬编码** —— 颜色全走 `:root` 的 OKLCH 纸感令牌 |
| 离线 | `service-worker.js`。缓存号当前 **`wb-cache-v076`**（只此一处写死；改前端必须 +1，跑 `tools/deploy.py` 会自动加，别手抄） |
| 同步 | Cloudflare Pages Functions `/api/data` + KV `WB_KV`（键 `wb_main`） |
| 门禁 | `npm test` **46 项**：`tests/test.js`（桌面 + 手机三尺寸）、`tests/test_interact.js`（交互与防回归） |
| 数字基线 | `tests/baseline.json` —— **所有随数据/界面变化的数字只在这里维护一处**，门禁脚本不写字面量 |
| 脚本地图 | `tools/README.md` —— 哪个脚本是生产用的、哪个是一次性探针、每条命令怎么敲 |
| 版本 | 界面里显示 `v0.1.0`；**真实版本看每次提交说明 + App 内「更新日志」（23 条）** |

## 二、目录结构

```
workbench/
├─ index.html · app.js · views.js · styles.css      前端四件套（**改功能只动这几个**）
├─ service-worker.js · manifest.webmanifest · icon-*.png    PWA（离线 + 装到桌面）
├─ functions/api/*.js       云端接口（随 Pages 一起部署）：data 同步 / ai 代理 / learnpack / tasks
├─ tools/
│   ├─ deploy.py            **一键部署**：前置检查 + 缓存号+1 + 同步暂存 + 上传 + 18 项线上自检
│   ├─ serve_lan.py         本地/局域网预览（`npm test` 连它；只服务白名单前端文件）
│   ├─ 启动局域网访问.bat     同上，给 Windows 双击用
│   └─ README.md            **脚本地图**（生产管线 / 验证 / 探针 / 安全网）
├─ tests/                   **入库**（回归网必须跟着代码走）：
│   ├─ test.js              桌面 + 手机三尺寸 UI 门禁
│   ├─ test_interact.js     交互 + 防回归（已删入口 / 残留文案 / 遍历 23 视图 / 数据迁移）
│   └─ baseline.json        **单一基线**：会漂的数字只在这里改
├─ cloudflare-worker.js + wrangler.toml   **旧版** Workers 同步（当前线上没用它；保留着是因为
│                                          wrangler.toml 里记着 KV 命名空间 ID）
├─ _attic/                  **不入库**：归档（只挪不删）
│   ├─ 2026-09-17/ · backup-*/ · removed-skills/   历史归档与改动前备份
│   ├─ tests-archive/       71 个一次性探针与历史版本测试
│   ├─ design-previews/     8/16 改版过程的设计原型页
│   └─ shots*/ · downloads-test/   截图与导出测试的落地目录（根目录不留测试垃圾）
├─ downloads/               **不入库**：手动导出数据的落地目录
├─ .pages-deploy/ · .wrangler/             **不入库**：部署暂存 / wrangler 缓存
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

**手机要用电脑上的本地版本（同一个 Wi-Fi）—— 用这个脚本，别自己 bind：**

```bash
python tools/serve_lan.py           # 会打印 http://<本机IP>:8000/，手机开这个
```

> 懒人版：**双击 `tools\启动局域网访问.bat`**（同一个脚本，只是套了个窗口，窗口别关）。
> 停止：Ctrl+C 或直接关窗口。首次要放行防火墙时用下面那条 netsh 命令（本机已加过 `workbench LAN 8000`）。

> ⚠️ **绝对不要**在**仓库根目录**用 `python -m http.server 8000 --bind 0.0.0.0` 开给局域网 ——
> 根目录里的 `.cf-env`（Cloudflare 令牌）和 `.sync-key.txt` 会被 HTTP 直接下载走
> （2026-09-17 实测：绑 `127.0.0.1` 时只有本机能读；一旦开给局域网，同一个 Wi-Fi 下**任何人**都能拿）。
> `tools/serve_lan.py` 只把 8 个前端文件拷到 `_attic/lan-serve/` 再开，凭据不在服务范围内（实测 `/.cf-env` → 404）。

> **手机打不开电脑的本地地址（显示"禁止访问/无法访问"）的两个原因**：
> ① 服务只绑了 `127.0.0.1`（本机实测就是这种）—— `127.0.0.1` 永远指"设备自己"，
> 在手机上它指手机本身，所以怎么输都连不上；必须绑 `0.0.0.0`（`serve_lan.py` 已经这么做）。
> ② Windows 防火墙拦了 python 入站（本机实测：防火墙三档全开、且没有 python 的放行规则）。
> 放行一次即可（管理员身份 cmd）：
> `netsh advfirewall firewall add rule name="workbench LAN 8000" dir=in action=allow protocol=TCP localport=8000`
>
> **日常在手机上用，直接开 `https://workbench-sync-c9e.pages.dev` 最省事** —— 不需要电脑开机、不用管防火墙、还是 https（有 PWA/离线能力）。局域网地址只是 http、非 localhost，浏览器**不会**注册 Service Worker，没有离线能力。

## 五、改完必须验证（两条命令）

```bash
cd E:\Software\workbench

# ① 语法：改完 app.js/views.js 立刻查
node --check app.js && node --check views.js && node --check service-worker.js

# ② 门禁（46 项断言；需要先起 8000 服务）
python tools/serve_lan.py 8000     # 起本地服务（另一个窗口；已在跑就不用再起）
npm test
```

`npm test` = `node --check views.js && node --check app.js && node tests/test.js && node tests/test_interact.js`

| 门禁 | 覆盖 |
|---|---|
| `tests/test.js`（27 项） | 桌面 1440×900 ＋ 手机 360/375/390：导航、卡片数、横向滚动、内容不被底部导航遮挡、触控区 ≥44px、无 JS 错误 |
| `tests/test_interact.js`（19 项） | 交互与防回归：录入入口已下线（按 action 名 ＋ 按可见文字遍历 23 个视图）、指向已下线功能的残留文案扫描、示例资料迁移、勾选/打卡/搜索/导出/回收站、**自动同步失败要报警（P1-6）** |
| `tests/baseline.json` | **单一基线** —— 会随数据/界面漂的数字（导航项数、底部导航入口数、已删板块表…）只在这里改 |

**判据**：退出码 0，且两个门禁各打出一行 `DONE  N PASS / 0 FAIL`。
⚠️ 退出码是 2026-09-18 才补上的 —— 之前断言全 FAIL 也退出 0，自动化根本看不出失败（变异测试抓到的）。

改之前跑一遍记下结果，改完再跑一遍对比 —— 这就是「零回归」的判据。
截图自动落 `_attic/shots/`，导出测试落 `_attic/downloads-test/`（都不脏根目录）。

### 门禁自身也要验证（变异测试）

「永远返回 PASS 的门禁等于没有门禁。」证明它有牙：

```bash
python _attic/mutation_probe.py     # 需先起 8000 服务
```

故意改坏 `app.js` 四处（把「专注」板块加回导航 / 清空录入入口白名单 / 让示例资料迁移失效 / 让自动同步失败不再报警），
要求每次都 **非 0 退出 且 打出 FAIL 且 不含 Traceback**（排除"它只是崩了"），跑完按字节还原并校验 md5。
2026-09-18 实测：4 个变异 4 个被抓到、app.js md5 与原件一致。

### 一次性探针别往 `tests/` 里塞

`tests/` 只放上面三个文件。历史版本测试与一次性探针已全部归档到 `_attic/tests-archive/`（71 个）；
日常常用的几个探针（手机端体检、逐视图抓报错、并发撕裂读验证、录入入口对账）见 `tools/README.md` 第三节。

### 补充门禁（已归档）：上传过文件的分支

`npm test` 用**干净数据**跑，测不到「已经上传过文件」的路径 —— 而 2026-09-17 那 3 个崩溃恰好只在有上传文件时触发。
这个探针专补这个盲区，现在归档在 `_attic/tests-archive/`（没并进 `npm test`，需要时手动跑）：

```bash
cd E:\Software\workbench
python -m http.server 8000 --bind 127.0.0.1                    # 先起服务
node _attic/tests-archive/_verify_filelist_crash_independent.js http://127.0.0.1:8000/          # 本地
node _attic/tests-archive/_verify_filelist_crash_independent.js https://workbench-sync-c9e.pages.dev/   # 线上也行
```

它往 localStorage 里种 3 个「上传过的文件」，然后依次走**政治页 / 专业课页 / 作文模板库弹窗**，13 项断言：
不但要求无 JS 报错，还要求**种进去的文件名真的出现在页面上**（渲染中断时必然不出现）。

**怎么证明它不是「永远通过」的**：拿修复前的旧代码跑必须挂 —— 那份已知会崩的副本留在 `_attic/2026-09-17/prefix-verify/`：

```bash
cd E:\Software\workbench\_attic\2026-09-17\prefix-verify && python -m http.server 8001 --bind 127.0.0.1
cd E:\Software\workbench && node _attic/tests-archive/_verify_filelist_crash_independent.js http://127.0.0.1:8001/
# 预期：3/13 通过 + 打印 kyFileListHtml is not defined / fmtSize is not defined，退出码 1
```

> 注意：Python 的 `http.server` 带 `allow_reuse_address`，**同一个端口能在 Windows 上被多个进程同时绑定**，请求随机命中一个 —— 出现莫名其妙的 `ERR_EMPTY_RESPONSE` 时先 `netstat -ano | grep ":8000 "` 看是不是有好几个监听，`taskkill /F /PID <pid>` 清掉再起。

## 五之二、视觉系统（styles.css，2026-09-17 重做）

`styles.css` **开头 5 行的注释就是设计规范，改样式前先读它**。要点：

| 规则 | 说明 |
|---|---|
| 颜色只有 5 类 | 墨 `--ink/--ink-2` ｜ 次级 `--sub/--muted` ｜ 线 `--line/--line-soft` ｜ 底 `--bg/--card/--soft/--chip` ｜ 强调 `--accent`（**全站唯一交互色**）+ 语义 `--ok/--warn/--danger` |
| 模块身份色 `--theme` | 17 个板块**同族低饱和** `oklch(45% .02-.10 H)`，只换色相；白字在各底色均 ≥4.5:1。**2026-09-18 从 `hsl()` 迁到 OKLCH**，并删掉已下线模块（health/calendar/accounts）的类 |
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
- `1846ac5` **第五批 · 向 english-trainer 对齐（色与字）**：颜色全改 OKLCH 纸感色阶（暖灰 hue 75 + 松绿 hue 158）；卡片零阴影（`--shadow-1: none`），层级改由 1px 描边 + 纸面色阶承担；标题改衬线（Georgia / 宋体 SC）；`--r-sm/md` 收到 6/10；`.card` 去盒（无背景/边框/内边距，靠 `margin-bottom: 26px` + 小标题分区）
- `9a3c941` **第六批 · 令牌收敛 + 列表细线化**（手机端"不好看"的根治）：第一遍只换了 `:root`，规则体里还散落 **48 处 `#fff` 方盒 / 30+ 处旧 hex / 21 处 `hsl()` 高饱和主题色**，与新令牌混用 —— 这批把它们全部收敛（颜色映射 91 处 + 主题色 17 处），现在 `styles.css` **0 处 hex 硬编码**。同时把手机端的方盒拉成细线行（今日行动 / 领域入口 / 考研科目卡 / 课程卡 / 复习统计块），「进入 →」5 种颜色收敛成次级墨色。脚本：`_attic/patch_visual.py`、`_attic/patch_flat.py`、`_attic/patch_flat2.py`（都是"追加覆盖段"，整段删掉即回滚）

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
- **录入入口白名单靠"渲染后按 `data-action` 摘按钮"**（`app.js` 的 `MANUAL_INPUT_ACTIONS`，配 `stripManualInput()`）：名字必须跟 `views.js` 里真实的 `data-action` **一字不差**。2026-09-18 踩坑 —— 表里写 `ky-task-add`、模板里实际是 `ky-add-task`，对不上就等于没删，结果「＋ 上传 PDF/图片/压缩包」「＋ 添加知识点总结」「＋ 添加自定义任务」「新建领域」一直留在考研页和设置页，用户看到的还是旧那一套。对账脚本：`python _attic/check-input-actions.py`；`npm test` 现在有**双重断言**（按 action 名 + 遍历 12 个视图按可见文字找"＋/上传/添加/新建/导入"开头的按钮）
- **CSS 里加颜色只走令牌**：`styles.css` 顶部 `:root` 就是设计规范，现在全文件 **0 处 hex 硬编码**。别写 `#fff` / `hsl(...)`，否则换主题/改色阶时那些地方会漏掉（第六批就是在收拾这个）

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
- **「部署了但手机端不更新」的两个真因**（2026-09-17 修，用户反馈过）：① `styles.css/views.js/app.js` 走的是「缓存优先」，部署后**第一次打开必然先返回旧缓存**，要开第二次才变；② 浏览器**只在「导航」时**才检查 SW 有没有更新，而手机 PWA 切后台再切回来没有发生导航 → 永远不检查 → 一直挂旧版。解法：`index.html` 里的资源引用挂版本号（`styles.css?v=vNNN` 等），新 HTML 引用的 URL 在旧缓存里必然 miss → 直接走网络 → **一次打开就是新版**；`deploy.py` 会把这里和 SW 缓存号**同步改并读回校验**，两处不一致直接判失败。另外 SW 注册处加了主动 `update()` + 回到前台再查一次，`controllerchange` 刷新加了防重复锁
- **排查「手机跑的是哪版」**：看左侧栏底部的版本号 —— 它是运行时从 Cache Storage 读出来的 `wb-cache-vNNN`（不是写死的字符串），显示什么就是本机实际在用的缓存。如果后面带「（有 N 份缓存）」，说明旧缓存没清干净

**验证类（截图 / 测试为什么会"骗人"）**
- **`tools/serve_lan.py` 原来是"启动那一刻的快照"**：它把前端白名单文件拷到 `_attic/lan-serve/` 再对外服务，`stage()` 只在 `main()` 里跑一次。改完代码不重启，8000 端口发出去的还是旧版本 —— 而 `npm test` 和截图脚本都跑在 8000 上，**等于测试和截图都在验证旧代码**（2026-09-18 因此白排查了一轮）。现改成「源文件签名（mtime_ns + size）变了才重新同步」。⚠️ **别改回"每个请求无脑 copy2"**：服务器是 `ThreadingTCPServer`，浏览器正在读 `views.js` 时另一个并发请求覆盖同一文件 → 读到半截 → `ReferenceError: Views is not defined` 整页白屏，表现是 `npm test` **间歇性失败**（同一份代码上一遍全绿、下一遍报错）。写盘必须走 `os.replace` 原子替换。验证脚本 `python _attic/probe-torn.py`（8 线程并发拉 + 另一线程反复改源文件，要求 0 撕裂）
- **无头截图必须绕过 Service Worker**：`page.setBypassServiceWorker(true)` + `page.setCacheEnabled(false)`。不绕的话第二次加载命中 SW 缓存，截出来是旧样式，会得出"我的改动没生效"的错误结论。参考 `_attic/shoot-local-full.js`（自带一个小体检：数页面上还有多少个"描边+圆角"盒子，`boxy: []` 就说明细线化到位了）
- **`deploy.py --dry-run` 原来有副作用**（2026-09-18 修）：它只跳过"上传"这一步，但 `bump_sw()` 照样把本地 `service-worker.js` / `index.html` 的版本号 +1 —— 于是干跑一次就变成「本地 v076 / 线上 v075」，本地与线上对不上。现在干跑只报告"真跑会变成什么"，一个字节都不写。**判据：干跑后 `git status` 不该多出 service-worker.js / index.html 的改动。**
- **门禁的退出码要单独验证**：两个门禁原来断言全 FAIL 也 `exit(0)`（末尾只有 `console.log("DONE")`）。「永远返回 0 的门禁等于没有门禁」—— 是变异测试（`_attic/mutation_probe.py`）才抓出来的。改门禁后先确认它**能失败**再看它通过。
- **删功能要连"话"一起删，别只删代码**：`submitImportWords()` 里有句 `var dict = {};` 后接 `dict[word] ? dict[word].t : ""` —— 词典删掉后它永远取不到值，可弹窗文案还写着「缺释义的已自动从内置词库补充」。**功能没了、承诺还在，比没有更坑**（以后接手的人会以为有词库）。判据：删任何功能后 grep 一遍它的名字 + 读一遍相关页面的可见文案。

## 九、待办

- [x] ~~把本地这 7 个 commit 推到 GitHub~~ ✅ 2026-09-17 完成（`8003f2e..626b90a`）。**注意**：`E:\backup\workbench\` 的备份和项目在**同一块 E 盘**，盘坏了两份一起没，GitHub 才是异地那一份
- [x] ~~把线上更新到当前本地版本（含首次部署 `service-worker.js`）~~ ✅ 2026-09-17 完成，见第六节的部署记录与 md5 自查表
- [x] ~~**以后每次改前端**必须走完整流程：`cp` 到 `.pages-deploy/` → **SW 缓存号 +1** → `wrangler pages deploy`~~ ✅ 2026-09-17 完成：`tools/deploy.py` 一条命令把这三步 + 18 项线上自检全干了。**现在「改前端」的正确姿势就是跑它**，别再手抄步骤（漏一步就会出「改了没生效」）
- [x] ~~部署流程自动化~~ ✅ 2026-09-17 完成：`tools/deploy.py`（含 `--test/--dry-run/--no-bump/--commit`），已实测跑通
- [ ] `app.js` 4657 行 / `views.js` 2874 行：是否拆模块，见 `OPTIMIZE-PLAN.md`（等你拍板，不擅自大改）
- [x] ~~词典链路（`gen_dict.py` → `dict.js` → 界面查词）~~ ✅ **2026-09-18 彻底删掉，不留悬空链路**。用户拍板：手机上本来就有翻译软件，工作台不做查词。删了什么：
  - **磁盘**：`_attic/dict-source/` 整个删掉（`ecdict_full.csv` 66 MB + `ecdict.zip` 5 MB + 两个脚本，共 68 MB）—— `_attic/` 因此从 98 MB 降到 30 MB
  - **代码**：`submitImportWords()` 里那个永远是空对象、却让文案宣称「缺释义的已自动从内置词库补充」的 `var dict = {}` 拿掉（这是句假话，会骗到以后接手的人）；`HELPS.wordbook` 里「未来可接入开源词典数据」那条也删了
  - **配置/文档**：`.gitignore` 里词典那三条目删掉；README 目录树里的 `dict-source/` 行删掉
  - **要是哪天想恢复**（别再靠记忆）：脚本在 git 历史里 —— `git show 0bd47a7^:gen_dict.py`、`git show 0bd47a7^:download_dict.py`；词表上游是 **ECDICT**（`https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv`）；`E:\backup\workbench\workbench-20260917.tar.gz` 里也还留着一份 66 MB 的 `ecdict_full.csv`
- [x] ~~`tests/` 60+ 个脚本没入库~~ ✅ 2026-09-18：**tests/ 已入库**（只留 `test.js` + `test_interact.js` + `baseline.json`）；71 个一次性探针与历史版本测试归档到 `_attic/tests-archive/`（留档，别再往 tests/ 里塞）
- [x] ~~数字散落在门禁脚本里~~ ✅ 2026-09-18：建 `tests/baseline.json` 单一基线，两个门禁的数字全部改成读它
- [x] ~~**GitHub 推送未完成**~~ ✅ **2026-09-18 补推成功**（`339875d..9fe309e main -> main`）。**判据别用 `git status` 的 ahead**（显式 URL 推送不更新 `origin/main` 引用）—— 用 `git ls-remote https://github.com/cy852123/workbench.git main` 跟 `git rev-parse HEAD` 对，两边相等才算推上去了
- [ ] **旧 Workers 还活着（2026-09-18 查清，等你一句话决定删不删）**：`wrangler deployments list --name workbench-sync` → **确实还在**（最后一次部署 2026-08-15 21:10，`wrangler whoami` 账号 `2b1d0f8b5fb6631b6d9471ea98cb75f8`）。但它**不是线上**：线上 `/api/data` 走 Pages Functions（`workbench-sync-c9e.pages.dev` 这个主机名归 Pages 项目，Worker 路由挂不上 `*.pages.dev`；旧 Worker 只有 `workbench-sync.cy852123.workers.dev/data` 这个入口，本机实测连不上、外面也早就没人用）
  - **风险不是"它抢了流量"，是"它读写同一个 KV 键 `wb_main`"**：万一哪台旧设备/旧书签还指着 workers.dev 那个地址，一按同步就会用**陈旧数据覆盖真数据**
  - 要删（一条命令，源码在本仓库根目录，随时能 `wrangler deploy` 回来）：`npx wrangler delete --name workbench-sync`（会连 Worker 一起删掉绑定声明，**KV 里的数据不动** —— 删完先 `curl -H "X-Sync-Key: …" .../api/data` 复核数据还在）
  - ⚠️ **2026-09-18 我没有自作主张删它**：删云上资源不可逆（虽然能重新部署），用户明确说过「不要乱删我没让你删的东西」
- [ ] **要不要转 private —— 先别转**。2026-09-17 实测：转 private 会**关掉 GitHub Pages**（`https://cy852123.github.io/workbench` 变 404），改回 public 也不自动恢复（已手动重建）。现在状态是 **public**。真要转之前：先确认手机桌面图标用的是不是 Pages 地址，并准备好重建 Pages
- [x] ~~确认 GitHub Pages 站点已恢复~~ ✅ 2026-09-17 完成：http_code **200**，Pages API `status: built`、source = `main` / `/`，且已自动重新部署到修复后的版本（v053）
- [ ] **论文写作领域还是 `hidden:true`**（入口不显示）

## 十、版本控制（2026-09-18 复核）

- 本地 git 仓库（`main`）。远端两个出口，**推送按下面的写法**：
  - `origin` = `git@github.com:cy852123/workbench.git`（SSH 22 端口**常被 reset**，别直接用）
  - 实测可靠：`git push https://github.com/cy852123/workbench.git main:main`（gh 凭据已配好）
  - ⚠️ 用**显式 URL** 推送**不会更新 `origin/main` 跟踪引用** → `git status` 里的 `ahead N` 会虚报，
    别据此判断"推上去了没有"；要确认就 `git ls-remote https://github.com/cy852123/workbench.git main`
- 提交身份是本仓库私有的 `cy852123 / cy852123@users.noreply.github.com`
- **跟踪 28 个文件**：前端四件套 + `service-worker.js` + `manifest.webmanifest` + 3 个图标 +
  `functions/api/` 4 个接口 + `tools/`（`deploy.py` / `serve_lan.py` / `启动局域网访问.bat` / `README.md`）+
  `tests/`（`test.js` / `test_interact.js` / `baseline.json`）+ `README.md` + `OPTIMIZE-PLAN.md` +
  旧 Workers 两件 + `package.json` / `package-lock.json`
- **不入库**（见 `.gitignore`）：凭据（`.cf-env` / `.sync-key.txt`）、个人数据、
  `.pages-deploy/` · `.wrangler/` · `node_modules/`、**`_attic/` 整目录**（含归档与改动前备份）、
  `downloads/`、截图、`logs/`
- 推送前审计过：**同步密钥与 Cloudflare 令牌在全部 git 历史里出现 0 次**
- ⚠️ **push 即发布**：仓库 public + main 根目录自动发 GitHub Pages（`https://cy852123.github.io/workbench`）→
  `index.html` 别挪位置、别改 `views.js`/`app.js` 的加载顺序
- ⚠️ **别把仓库转 private**：实测会关掉 GitHub Pages，改回 public 也不自动恢复（2026-09-17 已踩）
- 2026-09-17 做过一次「仓库瘦身」：把 73 个产物类文件（66 MB 词典、部署暂存、设计预览图、个人数据导出）从索引摘除，**当时磁盘文件一个没删**；**2026-09-18 又把词典原料 68 MB 从磁盘真删了**，所以「词典文件本来就在磁盘上」这句话已经过期。要恢复跟踪其它产物仍可 `git add .pages-deploy previews downloads`；要找回词典见第九节那条（git 历史里的脚本 + ECDICT 上游地址 + 0917 备份）
- 回滚整棵树：`git reset --hard <提交号>`；只回滚某文件：`git checkout <提交号> -- <文件>`
- 备份（都在 E 盘）：
  - `E:\backup\workbench\workbench-20260917.tar.gz`（搬迁前的整树，**含 66 MB `ecdict_full.csv` 与 .git** —— 词典已从项目里删掉，所以这份现在是词典原料的唯一磁盘副本）
  - `E:\backup\workbench\workbench-before-maintain-20260917.tar.gz`（本次整理前的整树）
  - `E:\backup\workbench\workbench-20260918-after-dict-removal.tar.gz`（2026-09-18 删掉词典 + 修完 P1-6 之后的整树；**已校验：凭据 0 条、无 csv/zip 词典资产、关键文件 8/8 在内、含 .git**）
  - `E:\backup\workbench\uncommitted-tracked-20260917.diff`（本次整理前那批未提交改动的完整 diff）

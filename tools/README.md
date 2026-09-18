# tools/ 脚本地图

> 只读这张表就能知道「哪个脚本是生产用的、哪个是一次性探针」。
> 规矩：**不按类别挪动脚本文件位置** —— 脚本互相引用、别处文档也按路径找它们；分类只体现在这张表里。

## 一、生产管线（按该跑的顺序）

| 脚本 | 作用 | 命令 |
|---|---|---|
| `tools/deploy.py` | **一键部署到 Cloudflare Pages**：前置检查（工作区干净 / 语法 / 凭据）→ SW 缓存号 +1 并同步 `index.html` → 同步 `.pages-deploy/` → 上传 → 18 项部署后自检（线上 md5 与本地逐项比对） | `python tools/deploy.py`<br>`--commit` 成功后自动提交缓存号＋index.html<br>`--allow-dirty` 带未提交改动部署（不推荐）<br>`--dry-run` 只检查不发布 |
| `tools/serve_lan.py` | **本地/局域网预览**（默认 8000）。`npm test` 与截图脚本都连它。只服务白名单前端文件（凭据进不去，有自检）；每次请求前比对源文件签名，变了才重新同步，且写盘走 `os.replace` 原子替换 | `python tools/serve_lan.py 8000` |
| `tools/启动局域网访问.bat` | 同上，给 Windows 双击用 | 双击运行 |

**部署前必须先起 8000 服务**（`npm test` 连的是 `localhost:8000`）。

## 二、验证（门禁，改完必跑）

| 脚本 | 作用 |
|---|---|
| `tests/test.js` | 桌面 1440×900 ＋ 手机 360/375/390 三尺寸：导航、卡片、横向滚动、内容不被底部导航遮挡、触控区 ≥44px、无 JS 错误 |
| `tests/test_interact.js` | 交互与防回归：录入入口已下线（按 action 名 ＋ 遍历 23 个视图按可见文字）、指向已下线功能的残留文案扫描、示例资料迁移、勾选/打卡/搜索/导出/回收站 |
| `tests/baseline.json` | **单一基线** —— 所有随数据/界面变化的数字（导航项数、底部导航入口数、已删板块表…）只在这里维护一处；门禁脚本只读它，不写字面量 |

**门禁自身也要验证**（"永远返回 PASS 的门禁等于没有门禁"）：

| 脚本 | 作用 | 命令 |
|---|---|---|
| `_attic/mutation_probe.py` | **变异测试**：故意改坏 `app.js` 三处（把「专注」加回导航 / 清空录入入口白名单 / 让示例资料迁移失效），要求门禁每次都**非 0 退出 且 打出 FAIL 且 不含 Traceback**（排除"它只是崩了"），跑完按字节还原并校验 md5 与原件一致 | `python _attic/mutation_probe.py`<br>（需先起 8000 服务） |

```bash
npm test      # = node --check views.js && node --check app.js && node tests/test.js && node tests/test_interact.js
```

截图输出统一落在 `_attic/shots/`，导出测试落在 `_attic/downloads-test/`（都不脏根目录、不入库）。

## 三、诊断探针（用完归档，别往 tests/ 里塞）

都在 `_attic/`（整目录不入库）：

| 脚本 | 作用 |
|---|---|
| `_attic/audit-mobile.js` | 手机端全板块体检：逐个视图采 `docH` / 小字号占比 / 卡片数，找信息过载与嫌小的字 |
| `_attic/probe-errors.js` | 逐视图跳转并抓 JS 报错（靠注入假按钮跳转，不需要 app 暴露导航函数） |
| `_attic/probe-torn.py` | 并发撕裂读验证：8 线程并发拉 `views.js` ＋ 另一线程反复改源文件，要求 0 次读到半截文件 |
| `_attic/check-input-actions.py` | 录入入口白名单对账：`MANUAL_INPUT_ACTIONS` 的名字 vs 模板里真实的 `data-action` |
| `_attic/shoot-local-full.js` | 桌面/手机全页截图（`SHOOT_W/SHOOT_H/SHOOT_MOBILE` 控视口），自带"还有多少描边圆角盒子"体检 |
| `_attic/fix-cloud-samples.py` | **改云端数据的正确写法样板**：先断言返回形状 → PUT 顶层对象 → 回读顶层核对 |

## 四、安全网

| 文件 | 说明 |
|---|---|
| `.gitignore` | 凭据、个人数据、构建产物、`_attic/` 一律不入库 |
| `_attic/backup-<日期>/` | 大改动前的整份源文件备份（比只靠 git 更省事） |
| `E:\backup\workbench\workbench-<日期>.tar.gz` | 异地备份（含 `tests/` 与 `_attic/`）。⚠️ **打包时必须排除 `.cf-env` 与 `.sync-key.txt`**（第一次打就把凭据打进去了） |
| GitHub `cy852123/workbench` | 异地那份代码。main 根目录自动发 GitHub Pages，所以 **push 即发布** |

## 五、根目录的历史遗留（保留，但不参与当前部署）

| 文件 | 说明 |
|---|---|
| `cloudflare-worker.js` + `wrangler.toml` | **旧版同步实现**（Cloudflare Workers ＋ KV，`wrangler deploy`）。现在的线上走 **Pages Functions**（`functions/api/*.js`）＋ `tools/deploy.py`，这两个文件不参与部署。保留是因为 `wrangler.toml` 里记着 KV 命名空间 ID。 |

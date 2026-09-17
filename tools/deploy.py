#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""一键部署 workbench 到 Cloudflare Pages（含自检与回滚提示）

为什么要有这个脚本
    这套部署原先靠手抄 4 条命令，已经出过两次事故：
      ① .pages-deploy/ 忘同步 → 线上还是旧版（2026-08-16）
      ② .pages-deploy/ 里从来没有 service-worker.js → 线上 PWA 缓存从未生效
      ③ 改前端忘把 SW 缓存号 +1 → 手机一直吃旧缓存，像"改了没生效"
    这个脚本把这 4 步固化成一条命令，并在最后逐文件核对线上 == 本地。

它做什么（按顺序）
    1. 前置检查：仓库干净、node --check 三文件、.cf-env 存在（可选跑 npm test）
    2. service-worker.js 缓存号 +1（可 --no-bump 跳过）
    3. 同步前端 8 个文件 + functions/api/*.js 到 .pages-deploy/
    4. wrangler pages deploy .pages-deploy --project-name workbench-sync --branch main
    5. 自检：线上 vs 本地 md5 逐文件比对、线上 SW 缓存号、/api/data 应为 401、首页应为 200

用法（在项目根跑）
    python tools/deploy.py                # 正常部署
    python tools/deploy.py --test         # 部署前先起服务跑 npm test（40 项）
    python tools/deploy.py --dry-run      # 只做检查与同步，不上传
    python tools/deploy.py --no-bump      # 不 +1 缓存号（仅首次上线用得上）
    python tools/deploy.py --allow-dirty  # 允许带着未提交改动部署（不推荐）
    python tools/deploy.py --commit       # 成功后自动提交 SW 缓存号那一处改动

回滚
    Cloudflare 控制台 → Pages → workbench-sync → Deployments → 选上一次 → Rollback
"""
from __future__ import print_function
import io, os, re, sys, json, time, shutil, hashlib, subprocess
import urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT = "workbench-sync"
BRANCH = "main"
ACCOUNT_ID = "2b1d0f8b5fb6631b6d9471ea98cb75f8"
SITE = "https://" + PROJECT + "-c9e.pages.dev"
FRONT = ["index.html", "app.js", "views.js", "styles.css", "service-worker.js",
         "manifest.webmanifest", "icon-192.png", "icon-512.png"]
CHECK_MD5 = ["app.js", "views.js", "styles.css", "service-worker.js", "manifest.webmanifest"]
STAGE = os.path.join(ROOT, ".pages-deploy")
UA = {"User-Agent": "curl/8.4"}   # Cloudflare 会拦 Python-urllib 的 UA（返回 403），必须伪装

ARGS = set(sys.argv[1:])
OK, FAIL = [], []


def say(msg):
    print(msg, flush=True)


def run(cmd, **kw):
    kw.setdefault("cwd", ROOT)
    kw.setdefault("shell", False)
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, **kw)
    out = p.communicate()[0]
    try:
        out = out.decode("utf-8", "replace")
    except Exception:
        out = str(out)
    return p.returncode, out


def note(ok, label, detail=""):
    (OK if ok else FAIL).append(label)
    say(("  PASS  " if ok else "  FAIL  ") + label + ("  | " + detail if detail else ""))
    return ok


def md5_local(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def fetch(path):
    req = urllib.request.Request(SITE + path, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


# ---------- 0. 环境 ----------
def find_wrangler():
    for n in ("wrangler.cmd", "wrangler.exe", "wrangler"):
        p = shutil.which(n)
        if p:
            return p
    cand = os.path.join(r"E:\Software\npm-global", "wrangler.cmd")
    return cand if os.path.exists(cand) else None


def load_env():
    """把 .cf-env 里的 CLOUDFLARE_API_TOKEN 读进 os.environ（不打印）"""
    p = os.path.join(ROOT, ".cf-env")
    if not os.path.exists(p):
        return None
    txt = io.open(p, encoding="utf-8", errors="replace").read()
    m = re.search(r"CLOUDFLARE_API_TOKEN\s*=\s*['\"]?([A-Za-z0-9_\-]+)", txt)
    if not m:
        return None
    os.environ["CLOUDFLARE_API_TOKEN"] = m.group(1)
    os.environ["CLOUDFLARE_ACCOUNT_ID"] = ACCOUNT_ID
    os.environ["WRANGLER_HOME"] = os.path.join(ROOT, ".wrangler")
    for extra in (r"E:\Software\npm-global",):
        if os.path.isdir(extra):
            os.environ["PATH"] = os.environ.get("PATH", "") + os.pathsep + extra
    return True


def ensure_server():
    """确保 8000 上有服务、且提供的正是本仓库当前的 app.js。
    返回 (临时进程或 None, 是否可用)。注意：Python 的 http.server 带 allow_reuse_address，
    Windows 上同一端口能被多个进程同时绑定、请求随机命中 —— 用一个卡死的旧进程占着时，
    这里会因为「取回来的 app.js 跟本地不一致」而判为不可用，而不是傻等。"""
    def fetch_app():
        with urllib.request.urlopen("http://127.0.0.1:8000/app.js", timeout=5) as r:
            return r.read()
    want = md5_local(os.path.join(ROOT, "app.js"))
    try:
        if hashlib.md5(fetch_app()).hexdigest() == want:
            say("  8000 上已有服务，且就是本仓库当前 app.js（复用，不另起）")
            return None, True
    except Exception:
        pass
    p = subprocess.Popen([sys.executable, "-m", "http.server", "8000", "--bind", "127.0.0.1"],
                         cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(40):
        time.sleep(0.25)
        try:
            if hashlib.md5(fetch_app()).hexdigest() == want:
                say("  已临时启动 8000 服务（跑完自动关）")
                return p, True
        except Exception:
            continue
    p.terminate()
    return None, False


def check_prereq():
    say("== 1. 前置检查 ==")
    rc, out = run(["git", "status", "--porcelain"])
    dirty = [l for l in out.splitlines() if l.strip()]
    if dirty and "--allow-dirty" not in ARGS:
        note(False, "工作区必须干净（否则线上跑的代码没进 git，不好回滚）",
             "有 %d 个未提交改动；确认要带上去就加 --allow-dirty" % len(dirty))
        return False
    note(True, "工作区干净" if not dirty else "工作区有 %d 个改动（--allow-dirty 已放行）" % len(dirty))
    for f in ("app.js", "views.js", "service-worker.js"):
        rc, out = run(["node", "--check", f])
        note(rc == 0, "node --check %s" % f, "" if rc == 0 else out.strip()[:160])
    note(load_env() is not None, "读到 .cf-env 里的 Cloudflare 令牌")
    if "--test" in ARGS:
        tmp, ok = ensure_server()
        note(ok, "8000 上有可用的本地服务",
             "" if ok else "端口可能被卡死的旧进程占着 —— netstat -ano | grep \":8000 \" 后 taskkill /F /PID <pid>")
        if ok:
            rc, out = run(["npm", "test"], shell=(os.name == "nt"))
            n = len(re.findall(r"^PASS", out, re.M))
            note(rc == 0 and n >= 40, "npm test 40 项全过", "实测 PASS %d 项" % n)
            if tmp:
                tmp.terminate()
                say("  临时服务已关闭")
    return not FAIL


# ---------- 2. 缓存号 +1 ----------
def bump_sw():
    say("\n== 2. Service Worker 缓存号 +1 ==")
    p = os.path.join(ROOT, "service-worker.js")
    txt = io.open(p, encoding="utf-8").read()
    m = re.search(r'wb-cache-v(\d+)', txt)
    if not m:
        note(False, "在 service-worker.js 里找不到 wb-cache-v<数字>")
        return False
    old, new = int(m.group(1)), int(m.group(1)) + 1
    if "--no-bump" in ARGS:
        note(True, "跳过 +1（--no-bump），仍为 v%d" % old)
        return True
    io.open(p, "w", encoding="utf-8", newline="").write(txt.replace("wb-cache-v%d" % old, "wb-cache-v%d" % new))
    note(True, "缓存号 v%d → v%d" % (old, new))
    return True


# ---------- 3. 同步暂存目录 ----------
def sync_stage():
    say("\n== 3. 同步 .pages-deploy/ ==")
    if not os.path.isdir(STAGE):
        os.makedirs(STAGE)
    for f in FRONT:
        src = os.path.join(ROOT, f)
        if not os.path.exists(src):
            note(False, "源文件缺失：%s" % f)
            continue
        shutil.copy2(src, os.path.join(STAGE, f))
    for f in FRONT:
        a, b = os.path.join(ROOT, f), os.path.join(STAGE, f)
        if not os.path.exists(b) or md5_local(a) != md5_local(b):
            note(False, "%s 同步失败" % f)
    apidir = os.path.join(STAGE, "functions", "api")
    if not os.path.isdir(apidir):
        os.makedirs(apidir)
    for f in os.listdir(os.path.join(ROOT, "functions", "api")):
        if f.endswith(".js"):
            shutil.copy2(os.path.join(ROOT, "functions", "api", f), os.path.join(apidir, f))
    note(True, "已同步前端 %d 个文件 + functions/api" % len(FRONT))
    return True


# ---------- 4. 部署 ----------
def deploy():
    say("\n== 4. 上传到 Cloudflare Pages ==")
    if "--dry-run" in ARGS:
        note(True, "--dry-run：跳过上传")
        return True
    wr = find_wrangler()
    if not wr:
        note(False, "找不到 wrangler（试试 npm i -g wrangler）")
        return False
    rc, out = run([wr, "pages", "deploy", ".pages-deploy",
                   "--project-name", PROJECT, "--branch", BRANCH])
    tail = [l for l in out.splitlines() if l.strip()][-3:]
    if not note(rc == 0, "wrangler pages deploy", " / ".join(tail)[:200]):
        return False
    m = re.search(r"https://[0-9a-f]+\.%s\.pages\.dev" % re.escape(PROJECT), out)
    if m:
        say("  本次快照地址：%s" % m.group(0))
    return True


# ---------- 5. 自检 ----------
def verify():
    say("\n== 5. 部署后自检（线上 vs 本地）==")
    time.sleep(3)
    try:
        for f in CHECK_MD5:
            want = md5_local(os.path.join(ROOT, f))
            got = hashlib.md5(fetch("/" + f)).hexdigest()
            note(want == got, "线上 %s 与本地 md5 一致" % f, "" if want == got else "线上=%s 本地=%s" % (got[:8], want[:8]))
        sw = fetch("/service-worker.js").decode("utf-8", "replace")
        m = re.search(r'wb-cache-v(\d+)', sw)
        local = re.search(r'wb-cache-v(\d+)', io.open(os.path.join(ROOT, "service-worker.js"), encoding="utf-8").read())
        note(bool(m) and bool(local) and m.group(1) == local.group(1),
             "线上 service-worker.js 真的是 SW（不是 index.html）",
             "线上缓存号 v%s" % (m.group(1) if m else "?"))
        try:
            fetch("/api/data")
            note(False, "/api/data 无密钥应 401", "竟然可读，密钥保护可能失效")
        except urllib.error.HTTPError as e:
            note(e.code == 401, "/api/data 无密钥返回 401（保护正常）", "HTTP %d" % e.code)
        try:
            body = fetch("/")
            note(len(body) > 500, "线上首页 200 且有内容", "%d 字节" % len(body))
        except Exception as e:
            note(False, "线上首页可访问", str(e))
    except Exception as e:
        note(False, "自检过程出错", str(e))
    return not FAIL


def main():
    say("workbench 一键部署  →  %s" % SITE)
    say("仓库：%s" % ROOT)
    if not check_prereq():
        say("\n前置检查没过，已停止（什么都没动）。")
        return 1
    if not bump_sw():
        return 1
    if not sync_stage():
        return 1
    if not deploy():
        say("\n上传失败。回滚：Cloudflare 控制台 → Pages → %s → Deployments → Rollback" % PROJECT)
        return 1
    verify()
    say("\n" + "=" * 60)
    say("通过 %d 项；失败 %d 项" % (len(OK), len(FAIL)))
    if FAIL:
        say("失败清单：\n  " + "\n  ".join(FAIL))
        say("回滚：Cloudflare 控制台 → Pages → %s → Deployments → 选上一次 → Rollback" % PROJECT)
        return 1
    if "--no-bump" not in ARGS and "--dry-run" not in ARGS:
        say('缓存号改了，建议提交：git add service-worker.js && git commit -m "SW 缓存号 +1（部署）"')
        if "--commit" in ARGS:
            run(["git", "add", "service-worker.js"])
            rc, out = run(["git", "commit", "-m", "SW 缓存号 +1（tools/deploy.py 自动提交）"])
            say("  已自动提交" if rc == 0 else "  自动提交失败：" + out.strip()[:120])
    say("提醒：改过 app.js/views.js/styles.css 之后跑本脚本，缓存号会自动 +1，手机下次打开即更新。")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""把工作台开给同一个 Wi-Fi 下的手机看（局域网访问）。

为什么单独写这个脚本，而不是直接 `python -m http.server`：
  在**仓库根目录**起服务时，根目录里的 `.cf-env`（Cloudflare 令牌）和
  `.sync-key.txt` 会被 HTTP 直接读走（2026-09-17 实测：HTTP 200，147 / 33 字节）。
  一旦绑到 0.0.0.0 开给局域网，同一个 Wi-Fi 下的**任何人**都能下载你的令牌。
  所以这里只把「前端白名单文件」拷到一个干净目录再对外开 ——
  凭据 / .git / README / tools 都不在服务范围内。

用法：
    python tools/serve_lan.py          # 默认 8000 端口
    python tools/serve_lan.py 8080     # 换端口
然后手机（同一个 Wi-Fi）打开脚本打印出来的 http://<本机IP>:<端口>/
Ctrl+C 停止。首次运行 Windows 可能弹防火墙提示，选「允许访问」。

注意：局域网地址是 http 且不是 localhost，浏览器**不会**注册 Service Worker，
所以这个地址上没有「离线可用 / 装到桌面」的 PWA 能力 —— 那要 https 那个正式地址。
"""
from __future__ import print_function
import os
import sys
import shutil
import socket
import hashlib
import functools
import threading

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from deploy import FRONT, ROOT          # 复用部署脚本的白名单，避免两处各写一份

PORT = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8000
SERVE = os.path.join(ROOT, "_attic", "lan-serve")   # 只放白名单文件，凭据不会进来


def md5(p):
    with open(p, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def lan_ips():
    """尽量拿全本机局域网地址（多网卡/虚拟网卡可能有好几个）"""
    ips = []
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.append(s.getsockname()[0])
        s.close()
    except Exception:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if ip not in ips and not ip.startswith("127."):
                ips.append(ip)
    except Exception:
        pass
    return ips


def _sig():
    """前端源文件的签名（mtime + size），用来判断"要不要重新同步"。"""
    out = []
    for f in FRONT:
        try:
            st = os.stat(os.path.join(ROOT, f))
            out.append((f, st.st_mtime_ns, st.st_size))
        except OSError:
            out.append((f, 0, 0))
    return tuple(out)


_STAGE_LOCK = threading.Lock()
_STAGE_SIG = [None]


def stage(force=False):
    """把前端白名单文件同步到服务目录。

    ⚠️ 写盘必须是原子的（先写 .tmp 再 os.replace）。原实现直接 copy2 覆盖目标文件，
    而服务器是 ThreadingTCPServer —— 浏览器正在读 views.js 时，另一个并发请求又触发
    一次拷贝，就可能读到半截文件，浏览器报 `ReferenceError: Views is not defined`，
    整页白屏。2026-09-18 加"每请求重新同步"后实测踩到（测试间歇性失败）。
    """
    if not os.path.isdir(SERVE):
        os.makedirs(SERVE)
    bad = []
    for f in FRONT:
        src, dst = os.path.join(ROOT, f), os.path.join(SERVE, f)
        if not os.path.exists(src):
            bad.append(f)
            continue
        if not force and os.path.exists(dst) and md5(src) == md5(dst):
            continue                      # 内容没变，别碰目标文件
        tmp = dst + ".tmp"
        shutil.copy2(src, tmp)
        os.replace(tmp, dst)              # 原子替换：读者要么看到旧版，要么看到新版
        if md5(src) != md5(dst):
            bad.append(f)
    return bad


def stage_if_stale():
    """每个请求前调一次：源文件真变了才重新同步，没变什么都不做。
    这样既保证本地预览/测试永远看到最新代码，又不会每个请求都重写文件。"""
    sig = _sig()
    if sig == _STAGE_SIG[0]:
        return
    with _STAGE_LOCK:
        if sig == _STAGE_SIG[0]:          # 双检：等锁期间别人已经同步过了
            return
        stage()
        _STAGE_SIG[0] = _sig()


def guard():
    """确认服务目录里没有凭据文件（防止以后有人往里拷东西）"""
    risky = []
    for name in os.listdir(SERVE):
        low = name.lower()
        if low.startswith(".") or "key" in low or "cf-env" in low or low.endswith((".pem", ".token", ".env")):
            risky.append(name)
    return risky


def main():
    bad = stage(force=True)
    _STAGE_SIG[0] = _sig()
    print("== 同步前端白名单文件 → %s" % SERVE)
    for f in FRONT:
        print("   %s  %s" % ("OK  " if f not in bad else "FAIL", f))
    if bad:
        print("\n有文件没同步成功，先停下：%s" % ", ".join(bad))
        return 1
    risky = guard()
    if risky:
        print("\n!! 服务目录里发现疑似凭据文件，已停止：%s" % ", ".join(risky))
        print("   这个目录只该放前端文件，删掉它们再跑")
        return 1
    print("   服务目录自检：只有前端文件，无 .cf-env / .sync-key.txt / .git  ✓")

    print("\n== 手机（同一个 Wi-Fi）打开其中任一个：")
    for ip in lan_ips() or ["<本机IP>"]:
        if ip.startswith("169.254."):        # 没连上网络时的自分配地址，没用
            continue
        print("   http://%s:%d/" % (ip, PORT))
    print("   本机浏览器：http://127.0.0.1:%d/" % PORT)
    print("   局域网地址是 http、非 localhost → 浏览器不注册 Service Worker，")
    print("   所以它没有离线/PWA 能力，只适合在手机上试本地改动。")
    print("   日常正式使用请开 https://workbench-sync-c9e.pages.dev")
    print("\n   手机连不上？多半是 Windows 防火墙拦了 python 的入站（本机实测防火墙"
          "三档全开、且没有 python 放行规则）。")
    print("   管理员身份开 cmd，执行一次即可放行本端口：")
    print('     netsh advfirewall firewall add rule name="workbench LAN %d" dir=in '
          "action=allow protocol=TCP localport=%d" % (PORT, PORT))
    print("\n   Ctrl+C 停止。\n")

    try:
        import http.server
        import socketserver

        class Srv(socketserver.ThreadingTCPServer):
            allow_reuse_address = True
            daemon_threads = True

        class LiveHandler(http.server.SimpleHTTPRequestHandler):
            """每次请求前检查一次前端文件是否变了（变了才重新同步）。

            为什么：stage() 原来只在启动时跑一次 —— 改完 app.js / styles.css 后，
            本地预览（以及跑在 8000 端口的 npm test、截图脚本）看到的还是启动那一刻的
            旧代码。2026-09-18 被这个坑到两次（截图和门禁都在验证旧版）。

            注意别改回"每个请求无脑 copy2"：本服务器是多线程的，浏览器在读
            views.js 时被另一个请求覆盖，会读到半截文件 →
            `ReferenceError: Views is not defined`，整页白屏。
            现在只在签名（mtime+size）变化时同步，且写盘走 os.replace 原子替换。"""

            def send_head(self):
                try:
                    stage_if_stale()
                except Exception:
                    pass
                return super().send_head()

        handler = functools.partial(LiveHandler, directory=SERVE)
        with Srv(("0.0.0.0", PORT), handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
    except OSError as e:
        print("起不来：%s" % e)
        print("端口可能被占用 —— netstat -ano | grep \":%d \" 看是谁，再 taskkill /F /PID <pid>" % PORT)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

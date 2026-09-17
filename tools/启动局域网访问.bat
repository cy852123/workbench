@echo off
chcp 936 >nul
title 工作台 - 手机访问（局域网）
cd /d E:\Software\workbench
echo ============================================
echo   工作台 · 手机访问启动器
echo ============================================
echo.
echo 下面会打印两个地址：
echo   本机浏览器用  http://127.0.0.1:8000/
echo   手机用同一个热点/Wi-Fi 打开 http://电脑IP:8000/
echo.
echo 停止：按 Ctrl+C，或直接关掉这个窗口
echo ============================================
echo.
python tools\serve_lan.py 8000
echo.
echo 服务已停止。按任意键关闭窗口。
pause >nul

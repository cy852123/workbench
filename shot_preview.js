/* 设计预览截图：打开 previews 目录下指定 HTML，截桌面+手机两张图 */
const puppeteer = require("puppeteer-core");
const path = require("path");

const file = process.argv[2] || "01-today.html";

(async () => {
  const browser = await puppeteer.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: "new", args: ["--no-sandbox"] });
  const url = "http://localhost:8000/previews/" + file;
  const base = path.basename(file, ".html");

  const p1 = await browser.newPage();
  await p1.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await p1.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
  await new Promise(r => setTimeout(r, 500));
  await p1.screenshot({ path: "previews/shot-" + base + "-desktop.png" });
  console.log("桌面截图: previews/shot-" + base + "-desktop.png");

  const p2 = await browser.newPage();
  await p2.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p2.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
  await new Promise(r => setTimeout(r, 500));
  await p2.screenshot({ path: "previews/shot-" + base + "-mobile.png" });
  console.log("手机截图: previews/shot-" + base + "-mobile.png");

  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });

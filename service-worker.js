/* 个人工作台 Service Worker：离线缓存 + 自动更新
   策略：
   - HTML 页面：优先网络（每次打开都是最新版），网络失败时用缓存（离线可用）
   - 静态资源（css/js）：先读缓存（秒开），后台拉取更新缓存
   - 发布新版本时更新 CACHE 版本号，旧缓存自动清理，一次刷新即生效 */
var CACHE = "wb-cache-v029";
var ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./views.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  /* HTML 导航：网络优先，保证最新版本 */
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }
  /* 静态资源：缓存优先，后台更新 */
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetched = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var c2 = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, c2); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || fetched;
    })
  );
});

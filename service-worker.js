/* 个人工作台 Service Worker：离线缓存 + 版本更新
   策略：先读缓存（秒开、可离线），同时后台拉取网络更新缓存。
   新版本发布时更新 CACHE 版本号，旧缓存自动清理。 */
var CACHE = "wb-cache-v011";
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
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetched = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || fetched;
    })
  );
});

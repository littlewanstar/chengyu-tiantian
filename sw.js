// 每次发布新版本时把 CACHE 的版本号加一(例如 chengyu-tiantian-v2)。
var CACHE = 'chengyu-tiantian-v2';

var PRECACHE = [
  './',
  'index.html',
  'style.css',
  'game.js',
  'ui.js',
  'data/levels.json',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  // 只拦截 GET 且同源的请求,其他一律放行。
  if (req.method !== 'GET') return;
  try {
    if (new URL(req.url).origin !== new URL(self.location).origin) return;
  } catch (e) {
    return;
  }

  event.respondWith(
    fetch(req).then(function (resp) {
      // 网络成功:把响应 clone 存进缓存再返回。
      var copy = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return resp;
    }).catch(function () {
      // 离线:回退缓存。
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        // 页面导航请求且缓存里也没有:回退到缓存的 index.html。
        if (req.mode === 'navigate') {
          return caches.match('index.html').then(function (page) {
            return page || Response.error();
          });
        }
        return Response.error();
      });
    })
  );
});

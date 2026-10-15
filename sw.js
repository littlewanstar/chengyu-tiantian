// 每次发布新版本时把 CACHE 的版本号加一(例如 chengyu-tiantian-v5)。
var CACHE = 'chengyu-tiantian-v16';

var PRECACHE = [
  './',
  'index.html',
  'style.css',
  'game.js',
  'ui.js',
  'data/levels.json',
  'scene.svg',
  'houses.js',
  'guests.js',
  'music.js',
  'estate.js',
  'estate-art.js',
  'manifest.webmanifest',
  'guests/g01.jpg',
  'guests/g02.jpg',
  'guests/g03.jpg',
  'guests/g04.jpg',
  'guests/g05.jpg',
  'guests/g06.jpg',
  'guests/g07.jpg',
  'guests/g08.jpg',
  'guests/g09.jpg',
  'guests/g10.jpg',
  'guests/g11.jpg',
  'guests/g12.jpg',
  'guests/g13.jpg',
  'guests/g14.jpg',
  'guests/g15.jpg',
  'guests/g16.jpg',
  'guests/g17.jpg',
  'guests/g18.jpg',
  'guests/g19.jpg',
  'guests/g20.jpg',
  'guests/g21.jpg',
  'guests/g22.jpg',
  'guests/g23.jpg',
  'guests/g24.jpg',
  'guests/g25.jpg',
  'guests/g26.jpg',
  'guests/g27.jpg',
  'guests/g28.jpg',
  'guests/g29.jpg',
  'guests/g30.jpg',
  'guests/g31.jpg',
  'guests/g32.jpg',
  'guests/g33.jpg',
  'guests/g34.jpg',
  'guests/g35.jpg',
  'guests/g36.jpg',
  'guests/g37.jpg',
  'guests/g38.jpg',
  'guests/g39.jpg',
  'guests/g40.jpg',
  'guests/g41.jpg',
  'guests/g42.jpg',
  'guests/g43.jpg',
  'guests/g44.jpg',
  'guests/g45.jpg',
  'guests/g46.jpg',
  'guests/g47.jpg',
  'guests/g48.jpg',
  'guests/g49.jpg',
  'guests/g50.jpg',
  'guests/g51.jpg',
  'guests/g52.jpg',
  'guests/g53.jpg',
  'guests/g54.jpg',
  'guests/g55.jpg',
  'guests/g56.jpg',
  'guests/g57.jpg',
  'guests/g58.jpg',
  'guests/g59.jpg',
  'guests/g60.jpg',

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

/* Service Worker - cache version; bump on deploy for instant updates */
const NEW_VERSION = '20250219-1';
const CACHE_NAME = 'app-cache-' + NEW_VERSION;
var BASE = self.location.pathname.replace(/\/[^/]*$/, '') || '/';
if (BASE !== '/') BASE += '/';
var STATIC_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'assets/app.css?v=20250219-1',
  BASE + 'assets/config.js?v=20250219-1',
  BASE + 'assets/i18n.js?v=20250219-1',
  BASE + 'assets/utils.js?v=20250219-1',
  BASE + 'assets/app.js?v=20250219-1',
  BASE + 'assets/modals.css?v=20250219-1',
  BASE + 'assets/modals.js?v=20250219-1',
  BASE + 'weather-animations.html?v=20250219-1'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS).catch(function () {});
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  var isNav = e.request.mode === 'navigate';
  var isHtml = url.indexOf('.html') !== -1 || (url.endsWith('/') || url.endsWith('/index.html'));
  if (isNav || (isHtml && url.startsWith(self.location.origin))) {
    e.respondWith(
      fetch(e.request).then(function (r) { return r; }).catch(function () {
        return caches.match(e.request).then(function (c) { return c || caches.match(BASE + 'index.html'); });
      })
    );
    return;
  }
  if (/\.(css|js|woff2?|ttf|ico|png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url)) {
    e.respondWith(
      caches.match(e.request).then(function (c) {
        return c || fetch(e.request).then(function (r) {
          var clone = r.clone();
          if (r.status === 200) caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, clone); });
          return r;
        });
      })
    );
  }
});

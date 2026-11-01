// オフラインでも開けるようにするための仕組み(サービスワーカー)
// 画面の部品は保存しておき、ニュースは毎回取りに行って、通信できないときだけ前回分を出す。
const VERSION = "v2";
const SHELL = `shell-${VERSION}`;
const DATA = "news-data";
const SHELL_FILES = ["./", "index.html", "about.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("shell-") && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // ニュース: ネット優先、だめなら保存分
  if (url.pathname.endsWith("/news.json")) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(DATA).then(c => c.put("news.json", copy));
        return res;
      }).catch(() => caches.open(DATA).then(c => c.match("news.json")).then(r => r || Response.error()))
    );
    return;
  }

  // ページを開くとき: ネット優先、だめなら保存したトップページ
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
    );
    return;
  }

  // それ以外(アイコンなど): 保存分を優先
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

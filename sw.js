/* Kantong service worker: aplikasi tetap terbuka saat offline.
 * Data akun (Supabase) tidak pernah disimpan di cache ini. */
const VERSION = "kantong-v1";
const SHELL = ["./", "index.html", "struk.js", "config.js", "privasi.html", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== "kantong-cdn").map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req, key) {
  const c = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(key || req, res.clone());
    return res;
  } catch (e) {
    return (await c.match(key || req)) || (await c.match("index.html")) || Response.error();
  }
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(VERSION);
  const hit = await c.match(req);
  const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}
async function cacheFirst(req) {
  const c = await caches.open("kantong-cdn");
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") c.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") return e.respondWith(networkFirst(req, "index.html"));
    if (url.pathname.endsWith("/config.js") || url.pathname.endsWith("/sw.js")) return e.respondWith(networkFirst(req));
    return e.respondWith(staleWhileRevalidate(req));
  }
  if (CDN.test(req.url)) return e.respondWith(cacheFirst(req));
  // Supabase, Google, dan lainnya: langsung ke jaringan, tidak di-cache.
});

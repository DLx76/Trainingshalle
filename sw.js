/* Offline-Cache mit Update-Nachfrage.
 * Bei jeder Änderung an den Dateien VERSION erhöhen und version.json anpassen.
 * Ablauf: Das Handy lädt die neue Fassung im Hintergrund komplett in einen neuen Cache.
 * Erst wenn der Nutzer in der App „Jetzt aktualisieren“ tippt, wird umgeschaltet.
 * Bis dahin läuft die bisherige Version unverändert weiter – auch offline in der Halle. */
const VERSION = "trainingshalle-1.7.0";
const FILES = ["./", "./index.html", "./app.js", "./uebungen.js", "./taktik.js", "./saison.js", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  // cache: "reload" umgeht den Browser-Cache, damit wirklich die neuen Dateien geladen werden
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))));
  // Kein automatisches skipWaiting: Die App fragt den Nutzer.
});
self.addEventListener("message", e => { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Cache zuerst (schneller Start, auch bei schlechtem Hallen-WLAN), sonst Netz.
// version.json immer frisch aus dem Netz – daraus liest die App, was neu ist.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith("/version.json")) { e.respondWith(fetch(e.request, { cache: "no-store" })); return; }
  e.respondWith(
    caches.open(VERSION).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }).catch(() => c.match("./index.html"))))
  );
});

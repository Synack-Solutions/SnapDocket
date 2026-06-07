// SnapDocket Service Worker — offline support and background sync stub
// TODO: Implement full offline strategy using Workbox or manual cache-first logic

const CACHE_NAME = "snapdocket-v1";
const STATIC_ASSETS = ["/", "/dashboard", "/manifest.json"];

// Install: pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== "GET" || url.origin !== location.origin) return;

  // API routes — always network, no caching
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background sync — offline invoice creation queue
// TODO: Implement using IndexedDB queue + sync on reconnect
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-invoices") {
    event.waitUntil(syncOfflineInvoices());
  }
});

async function syncOfflineInvoices() {
  // TODO: Read from IndexedDB queue, POST to /api/invoices, clear on success
  console.log("[sw] syncOfflineInvoices — not yet implemented");
}

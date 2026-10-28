/* CILRMNG registry service worker — offline app shell + durable cache. */
const VERSION = "cilrmng-v5";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

/** Every page a device may need while offline. */
const PRECACHE = [
  "/",
  "/guest",
  "/sync",
  "/settings",
  "/offline",
  "/login",
  "/images/cilrm-logo.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API data is always live; offline writes are queued in IndexedDB by the app.
  if (url.pathname.startsWith("/api/")) return;

  // Pages: network-first so content is fresh, cache fallback when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(SHELL)
            .then((cache) => cache.put(request, copy))
            .catch(() => undefined);
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match(request)) || (await caches.match(url.pathname));
          if (cached) return cached;
          const offline = await caches.match("/offline");
          return (
            offline ||
            new Response("You are offline and this page has not been saved on this device yet.", {
              headers: { "Content-Type": "text/plain" },
            })
          );
        }),
    );
    return;
  }

  // Static assets: cache-first, they are content-hashed by Next.js.
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/images") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches
              .open(ASSETS)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined);
            return response;
          }),
      ),
    );
  }
});

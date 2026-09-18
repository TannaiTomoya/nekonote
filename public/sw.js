// Only same-origin static app shells are cached; no Supabase requests or user data.
const CACHE = "nekonote-shell-v1";
const ROUTES = [
  "/today",
  "/today/mood",
  "/today/money",
  "/money",
  "/money/recurring",
  "/calendar",
  "/care",
  "/review",
  "/settings",
  "/support",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        ROUTES.map(async (path) => {
          try {
            const response = await fetch(path);
            if (!response.ok) return;
            const html = await response.clone().text();
            await cache.put(path, response);
            const assets = [
              ...html.matchAll(
                /(?:src|href)="([^" ]+\.(?:js|css)(?:\?[^" ]*)?)"/g,
              ),
            ]
              .map((m) => m[1])
              .filter((p) => p.startsWith("/_next/"));
            await Promise.all(
              assets.map(async (asset) => {
                try {
                  await cache.add(asset);
                } catch {}
              }),
            );
          } catch {}
        }),
      );
      await self.skipWaiting();
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("nekonote-shell-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.origin !== location.origin ||
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/")
  )
    return;
  // Flight requests have distinct cache variants; never cache them as HTML.
  if (event.request.headers.get("RSC") === "1") return;
  if (event.request.mode === "navigate")
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (
            response.ok &&
            (ROUTES.includes(url.pathname) || url.pathname.startsWith("/care/"))
          ) {
            const cache = await caches.open(CACHE);
            await cache.put(url.pathname, response.clone());
          }
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(url.pathname)) ||
            (await caches.match("/today")) ||
            Response.error()
          );
        }),
    );
  else if (url.pathname.startsWith("/_next/static/"))
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(event.request);
        if (hit) return hit;
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      })(),
    );
});

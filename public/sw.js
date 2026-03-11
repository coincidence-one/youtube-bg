/**
 * YouTube BG Player — Service Worker
 * 앱 셸 캐싱 + Network-first 전략
 */

const CACHE_NAME = "ytbg-v1";

// 프리캐시할 앱 셸 리소스
const APP_SHELL = [
  "/",
  "/icon-192.png",
  "/icon-512.png",
  "/icon.svg",
  "/manifest.json",
];

// install: 앱 셸 프리캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// activate: 오래된 캐시 삭제
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// fetch: Network-first (API/동적) | Cache-first (정적)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // YouTube / 외부 API는 캐시하지 않음
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/")
  ) {
    return;
  }

  // 정적 파일: Cache-first
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|woff2?)$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // 나머지: Network-first, 실패 시 캐시
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

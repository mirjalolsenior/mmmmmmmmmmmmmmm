export const dynamic = "force-dynamic"

export async function GET() {
  const serviceWorkerCode = `
// Service Worker with Web Push API support for Android and iOS PWA
// NOTE:
// - iOS Safari PWA (16.4+) supports **standard Web Push (VAPID)**.
// - Firebase Cloud Messaging (FCM) web push is not reliable / not supported on iOS.
// Shuning uchun bu SW Web Push uchun optimallashtirilgan.

const CACHE_NAME = "sherdor-mebel-v2"
const PRECACHE_URLS = ["/", "/manifest.json", "/icon-192.jpg", "/icon-512.jpg"]

const isCacheableRequest = (req) => {
  try {
    if (req.method !== "GET") return false
    const url = new URL(req.url)
    // Faqat shu domen (same-origin)
    if (url.origin !== self.location.origin) return false
    // API larni cache qilmaymiz
    if (url.pathname.startsWith("/api")) return false
    // Service worker faylini ham cache qilmaymiz
    if (url.pathname === "/sw.js") return false
    return true
  } catch {
    return false
  }
}

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Cache opened")
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn("[SW] Some files failed to cache:", err)
          return Promise.resolve()
        })
      })
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("fetch", (event) => {
  if (!isCacheableRequest(event.request)) return

  // Cache-first for static assets, network-first for documents.
  const dest = event.request.destination
  const isDocument = dest === "document" || dest === ""

  if (isDocument) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match("/"))),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() => cached),
    }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received:", event)

  // Defaults (safe for Android Chrome + iOS 16.4+ PWA)
  let title = "Sherdor Mebel"
  let body = "Yangi xabar"
  let icon = "/icon-192.jpg"
  let badge = "/icon-192.jpg"
  let vibrate = [100, 50, 100]
  let url = "/"
  let actions = [
    { action: "explore", title: "Ko'rish" },
    { action: "close", title: "Yopish" },
  ]

  if (event.data) {
    try {
      const parsed = event.data.json()
      console.log("[SW] Push payload:", parsed)

      // Support both formats:
      // 1) WebPush: { title, body, icon, ... }
      // 2) FCM-style: { notification: { title, body }, ... }
      const root = parsed || {}
      const n = root.notification || {}

      title = n.title || root.title || title
      body = n.body || root.body || body
      icon = root.icon || icon
      badge = root.badge || badge
      vibrate = root.vibrate || vibrate
      url = (root.data && root.data.url) || root.url || url
      actions = root.actions || actions
    } catch (e) {
      try {
        body = event.data.text() || body
      } catch {
        // ignore
      }
    }
  }

  // IMPORTANT: Use only standard NotificationOptions fields to avoid runtime errors
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      vibrate,
      tag: "sherdor-mebel-notification",
      // iOS PWA'da "requireInteraction" ba'zida agresiv bo'lishi mumkin,
      // lekin muhim xabarlar uchun foydali. Default: true.
      requireInteraction: true,
      data: {
        dateOfArrival: Date.now(),
        url,
      },
      actions,
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action)
  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      }),
  )
})

self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed")
})

self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
`

  return new Response(serviceWorkerCode, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}

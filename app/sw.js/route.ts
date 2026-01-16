export const dynamic = "force-dynamic"

export async function GET() {
  const serviceWorkerCode = `
// Service Worker with Web Push API support for Android and iOS PWA
const CACHE_NAME = "sherdor-mebel-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192.jpg", "/icon-512.jpg"]

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Cache opened")
        return cache.addAll(urlsToCache).catch((err) => {
          console.warn("[SW] Some files failed to cache:", err)
          return Promise.resolve()
        })
      })
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone()
        if (!response || response.status !== 200 || response.type === "error") {
          return response
        }

        // Clone the response before caching to prevent body consumption
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
      .catch(() => {
        return caches.match(event.request).then((response) => response || new Response("Offline"))
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

  let notificationData = {
    title: "Sherdor Mebel",
    body: "Yangi xabar",
    icon: "/icon-192.jpg",
    badge: "/icon-192.jpg",
    vibrate: [100, 50, 100],
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      notificationData.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      tag: "sherdor-mebel-notification",
      requireInteraction: true,
      priority: "high",
      sticky: true,
      silent: false,
      data: {
        dateOfArrival: Date.now(),
        url: "/",
        ...notificationData.data,
      },
      actions: [
        {
          action: "explore",
          title: "Ko'rish",
          icon: "/icon-192.jpg",
        },
        {
          action: "close",
          title: "Yopish",
          icon: "/icon-192.jpg",
        },
      ],
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

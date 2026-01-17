"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

// IMPORTANT:
// iOS 16.4+ (Safari PWA) works with the standard Web Push API (PushManager + VAPID).
// Firebase Cloud Messaging (FCM) web push is unreliable / unsupported for iOS Safari.
// So we subscribe using Web Push for ALL platforms (Android + iOS + Desktop).

interface PWAContextType {
  isInstalled: boolean
  isInstallable: boolean
  installPWA: () => Promise<void>
  notificationPermission: NotificationPermission
  requestNotificationPermission: () => Promise<void>
  /**
   * Backwards-compatible helper used by some UI components.
   * Subscribes the device/browser to Web Push (VAPID) by requesting
   * notification permission and registering/subscribing via the Service Worker.
   */
  subscribeToPush: () => Promise<void>
  sendNotification: (title: string, body: string) => void
  scheduleNotification: (title: string, body: string, delayMinutes: number) => void
  // kept for backwards compatibility with UI that may show a token
  fcmToken: string | null
  isPushSupported: boolean
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [fcmToken, setFcmToken] = useState<string | null>(null)

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }

    setIsPushSupported("serviceWorker" in navigator && "Notification" in window)

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    registerServiceWorkerAndSubscribe()

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const registerServiceWorkerAndSubscribe = async () => {
    try {
      if (!("serviceWorker" in navigator)) return

      // Register our Web Push service worker (served from app/sw.js/route.ts)
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      console.log("[Push] Service Worker registered:", registration)

      // If permission already granted, subscribe immediately
      if (Notification.permission === "granted") {
        await subscribeWebPush(registration)
      }
    } catch (error) {
      console.error("[Push] Service Worker registration / subscribe failed:", error)
    }
  }

  const subscribeWebPush = async (registration: ServiceWorkerRegistration) => {
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        console.warn("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set")
        return
      }

      // Reuse existing subscription if present
      const existing = await registration.pushManager.getSubscription()
      const sub =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }))

      // Store subscription in Supabase via API route
      const res = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        console.warn("[Push] Failed to store subscription:", res.status, txt)
        return
      }

      // For UI compatibility (optional): store endpoint as a "token"
      setFcmToken(sub.endpoint)
      console.log("[Push] Subscribed & stored:", sub.endpoint.slice(0, 60) + "...")
    } catch (e) {
      console.error("[Push] subscribeWebPush error:", e)
    }
  }

  const installPWA = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setIsInstallable(false)
      setIsInstalled(true)
      setDeferredPrompt(null)
    }
  }

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === "granted") {
        const reg = await navigator.serviceWorker.getRegistration("/")
        if (reg) {
          await subscribeWebPush(reg)
        } else {
          await registerServiceWorkerAndSubscribe()
        }
      }
    } catch (error) {
      console.error("[Push] Notification permission error:", error)
    }
  }

  // Alias used by older components (e.g. notification-manager.tsx)
  const subscribeToPush = async () => {
    await requestNotificationPermission()
  }

  const sendNotification = (title: string, body: string) => {
    if (notificationPermission === "granted") {
      new Notification(title, {
        body,
        icon: "/icon-192.jpg",
        badge: "/icon-192.jpg",
        vibrate: [100, 50, 100],
      })
    }
  }

  const scheduleNotification = (title: string, body: string, delayMinutes: number) => {
    if (notificationPermission === "granted") {
      setTimeout(
        () => {
          sendNotification(title, body)
        },
        delayMinutes * 60 * 1000,
      )
    }
  }

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isInstallable,
        installPWA,
        notificationPermission,
        requestNotificationPermission,
        subscribeToPush,
        sendNotification,
        scheduleNotification,
        fcmToken,
        isPushSupported,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider")
  }
  return context
}

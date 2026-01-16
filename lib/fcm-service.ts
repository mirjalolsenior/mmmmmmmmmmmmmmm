import { initializeFirebase } from "./firebase-config"
import { getToken } from "firebase/messaging"
import { getFirebaseVapidKey } from "@/app/actions/firebase-actions"

const FCM_TOKEN_KEY = "fcm_token"
const FCM_TOKEN_TIMESTAMP_KEY = "fcm_token_timestamp"
const TOKEN_REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000 // 7 days

export const generateAndStoreFCMToken = async (): Promise<string | null> => {
  try {
    // Initialize Firebase
    const messaging = await initializeFirebase()
    if (!messaging) {
      console.warn("[FCM] Firebase messaging not supported")
      return null
    }

    // Check if we have a valid token in localStorage
    const storedToken = localStorage.getItem(FCM_TOKEN_KEY)
    const tokenTimestamp = localStorage.getItem(FCM_TOKEN_TIMESTAMP_KEY)
    const now = Date.now()

    if (storedToken && tokenTimestamp) {
      const timestamp = Number.parseInt(tokenTimestamp, 10)
      if (now - timestamp < TOKEN_REFRESH_INTERVAL) {
        console.log("[FCM] Using cached FCM token")
        return storedToken
      }
    }

    const vapidKey = await getFirebaseVapidKey()

    const token = await getToken(messaging, { vapidKey })
    if (token) {
      localStorage.setItem(FCM_TOKEN_KEY, token)
      localStorage.setItem(FCM_TOKEN_TIMESTAMP_KEY, now.toString())
      console.log("[FCM] FCM token generated and stored:", token.slice(0, 50) + "...")
      return token
    }
  } catch (error) {
    console.error("[FCM] Error generating FCM token:", error)
  }

  return null
}

export const getFCMToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(FCM_TOKEN_KEY)
}

export const clearFCMToken = (): void => {
  localStorage.removeItem(FCM_TOKEN_KEY)
  localStorage.removeItem(FCM_TOKEN_TIMESTAMP_KEY)
  console.log("[FCM] FCM token cleared")
}

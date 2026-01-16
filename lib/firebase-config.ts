import { initializeApp } from "firebase/app"
import { getMessaging, isSupported } from "firebase/messaging"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: any = null
let messaging: any = null

export const initializeFirebase = async () => {
  if (typeof window === "undefined") return null

  if (app) return messaging

  try {
    app = initializeApp(firebaseConfig)
    if (await isSupported()) {
      messaging = getMessaging(app)
      console.log("[FCM] Firebase initialized successfully")
    }
    return messaging
  } catch (error) {
    console.error("[FCM] Firebase initialization error:", error)
    return null
  }
}

export const getFirebaseMessaging = () => messaging
export const getFirebaseApp = () => app

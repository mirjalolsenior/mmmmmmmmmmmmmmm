"use server"

export async function getFirebaseVapidKey(): Promise<string> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    throw new Error("Firebase VAPID key not configured")
  }
  return vapidKey
}

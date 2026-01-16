export const dynamic = "force-dynamic"

export async function GET() {
  const firebaseServiceWorkerCode = `
// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyBydj36ZZ-sIVyRNV16F6xuxoMtocMxrNs",
  authDomain: "mebee-621e2.firebaseapp.com",
  projectId: "mebee-621e2",
  storageBucket: "mebee-621e2.firebasestorage.app",
  messagingSenderId: "620663581568",
  appId: "1:620663581568:web:05b9fde830dc0edc2fef65",
});

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[Firebase FCM] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon-192.jpg',
    badge: '/icon-192.jpg',
    vibrate: [100, 50, 100],
    tag: 'fcm-notification',
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
`

  return new Response(firebaseServiceWorkerCode, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
    },
  })
}

// Import Firebase compat SDKs (SW da modul import ishlamaydi, shuning uchun compat ishlatamiz)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase konfiguratsiyasi (Vercel .env dagi credential'larni qo'lda shu yerga yozish kerak)
firebase.initializeApp({
  apiKey: "AIzaSyBydj36ZZ-sIVyRNV16F6xuxoMtocMxrNs",
  authDomain: "mebee-621e2.firebaseapp.com",
  projectId: "mebee-621e2",
  storageBucket: "mebee-621e2.firebasestorage.app",
  messagingSenderId: "620663581568",
  appId: "1:620663581568:web:05b9fde830dc0edc2fef65",
});

// Messaging obyekti
const messaging = firebase.messaging();

// Background notification handling
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Notification sozlamalari
  const notificationTitle = payload.notification?.title || 'Background Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico'
  };

  self.registration.showNotification("TEST 🔔", {
  body: "Agar buni ko‘rsang — hammasi ishlayapti"
});

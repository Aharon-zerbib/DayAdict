/*
 * Service worker Firebase Cloud Messaging pour notifications en arrière-plan.
 * Assure-toi que la config ci-dessous correspond à ton projet Firebase.
 */

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyAfIEECqrCtli6HMYG8dii5a0KQDTPFANg",
  authDomain: "test-37471.firebaseapp.com",
  projectId: "test-37471",
  storageBucket: "test-37471.firebasestorage.app",
  messagingSenderId: "784855671505",
  appId: "1:784855671505:web:8f95e57b581026a3a25bf0",
  measurementId: "G-XSN4EFSG01",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "DayAdict";
  const notificationOptions = {
    body: payload.notification?.body || "Nouveau message de DayAdict",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

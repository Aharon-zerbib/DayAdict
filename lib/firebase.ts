// Firebase client initialization for Next.js (App Router)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import {
  getMessaging,
  getToken,
  onMessage,
  type MessagePayload,
  type Messaging,
} from "firebase/messaging";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

// Ensure we don't re-initialize on hot reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth (works in browser; used only in client components)
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore database
const db = getFirestore(app);

// Analytics (browser only)
let analytics: Analytics | null = null;

// Cloud Messaging (browser only)
let messaging: Messaging | null = null;

const getMessagingInstance = () => {
  if (typeof window === "undefined") return null;
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
};

if (typeof window !== "undefined") {
  // Analytics is only supported in the browser
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

const requestPushNotificationToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { type: "module" }
  );

  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("NEXT_PUBLIC_FIREBASE_VAPID_KEY manquant pour FCM web.");
    return null;
  }

  try {
    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (error) {
    console.error("Erreur lors de la récupération du token FCM", error);
    return null;
  }
};

const onForegroundMessage = (callback: (payload: MessagePayload) => void) => {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return;
  onMessage(messagingInstance, callback);
};

export {
  app,
  db,
  auth,
  googleProvider,
  analytics,
  signInWithPopup,
  onAuthStateChanged,
  requestPushNotificationToken,
  onForegroundMessage,
};
export type { User };

// Firebase client initialization for Next.js (App Router)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
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

export { app, db, auth, googleProvider, analytics, signInWithPopup, onAuthStateChanged };
export type { User };

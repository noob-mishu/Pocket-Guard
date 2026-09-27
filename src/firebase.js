// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration. Set REACT_APP_FIREBASE_* env vars (see .env.example)
// to override; the hard-coded fallbacks keep the app runnable without a .env file.
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyCzAHEkM8Yb2s2MzplLWlZgy8oroC9cjPQ",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "pocketguard-2024.firebaseapp.com",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || "pocketguard-2024",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "pocketguard-2024.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "138692945855",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:138692945855:web:4f2bfbaffb60258189e30a",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-NHRLQ2VQVF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
export { db, auth, provider, storage, doc, setDoc };
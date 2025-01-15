// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

import { getFirestore, doc, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzAHEkM8Yb2s2MzplLWlZgy8oroC9cjPQ",
  authDomain: "pocketguard-2024.firebaseapp.com",
  projectId: "pocketguard-2024",
  storageBucket: "pocketguard-2024.firebasestorage.app",
  messagingSenderId: "138692945855",
  appId: "1:138692945855:web:4f2bfbaffb60258189e30a",
  measurementId: "G-NHRLQ2VQVF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { db, auth, provider, doc, setDoc };
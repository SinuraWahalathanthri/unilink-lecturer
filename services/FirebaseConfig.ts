import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDjiPnqHAfTKNZ460ONc7dCmum-Z08_LSw",
  authDomain: "uni-link-3fce5.firebaseapp.com",
  projectId: "uni-link-3fce5",
  storageBucket: "uni-link-3fce5.firebasestorage.app",
  messagingSenderId: "650386703526",
  appId: "1:650386703526:web:ce3143186fd0eb7eaca067",
  measurementId: "G-FQ8ZK74J8N",
};

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_ANALYTICS = getAnalytics(FIREBASE_APP);
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP);
export const db = getFirestore(FIREBASE_APP);

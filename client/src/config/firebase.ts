// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v9.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBI0qizkQ8oN6THned8ZRutqfSLTHiRUO0",
  authDomain: "axiona-df005.firebaseapp.com",
  projectId: "axiona-df005",
  storageBucket: "axiona-df005.firebasestorage.app",
  messagingSenderId: "690812667647",
  appId: "1:690812667647:web:fffa8196de9fe377f8aeca",
  measurementId: "G-WZ0Z0B6P6X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

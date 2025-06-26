
import { initializeApp,getApp,getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEJf6mhasNkRNiibgdrbPEmh6wvrLGWFo",
  authDomain: "intervview-b0771.firebaseapp.com",
  projectId: "intervview-b0771",
  storageBucket: "intervview-b0771.firebasestorage.app",
  messagingSenderId: "107551720120",
  appId: "1:107551720120:web:68442e35625f8ca3c0aa4d",
  measurementId: "G-479D6SP6L2"
};

// Initialize Firebase
const app = !getApps.length? initializeApp(firebaseConfig):getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
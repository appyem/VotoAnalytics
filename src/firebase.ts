import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcqv0IIP7_P_V-032GogN_nk2V0Om57-w",
  authDomain: "votoanalytics-b9358.firebaseapp.com",
  projectId: "votoanalytics-b9358",
  storageBucket: "votoanalytics-b9358.firebasestorage.app",
  messagingSenderId: "601646133715",
  appId: "1:601646133715:web:6d2a5c15f5c5e349a0ff26"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
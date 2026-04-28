import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTQOvTrVteyFoxacYHxMNSmoCQBSF5pqc",
  authDomain: "quran-tracking-for-tutor-387ce.firebaseapp.com",
  projectId: "quran-tracking-for-tutor-387ce",
  storageBucket: "quran-tracking-for-tutor-387ce.firebasestorage.app",
  messagingSenderId: "1034262668810",
  appId: "1:1034262668810:web:40f9065973f7e8bdfd21f3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// السطر ده هو اللي بيجبر المتصفح يحفظ تسجيل الدخول
setPersistence(auth, browserLocalPersistence).catch(console.error);

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTQOvTrVteyFoxacYHxMNSmoCQBSF5pqc",
  authDomain: "quran-tracking-for-tutor-387ce.firebaseapp.com",
  projectId: "quran-tracking-for-tutor-387ce",
  storageBucket: "quran-tracking-for-tutor-387ce.firebasestorage.app",
  messagingSenderId: "1034262668810",
  appId: "1:1034262668810:web:40f9065973f7e8bdfd21f3"
};

// تهيئة المشروع
const app = initializeApp(firebaseConfig);

// تصدير خدمات فايربيز (تسجيل الدخول وقاعدة البيانات)
export const auth = getAuth(app);
export const db = getFirestore(app);

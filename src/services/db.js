import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTQOvTrVteyFoxacYHxMNSmoCQBSF5pqc",
  authDomain: "quran-tracking-for-tutor-387ce.firebaseapp.com",
  projectId: "quran-tracking-for-tutor-387ce",
  storageBucket: "quran-tracking-for-tutor-387ce.firebasestorage.app",
  messagingSenderId: "1034262668810",
  appId: "1:1034262668810:web:40f9065973f7e8bdfd21f3",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // 👈 إضافة الـ Auth

export function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).substring(2);
}

function mergeArraysById(localArr, cloudArr) {
  if (!Array.isArray(localArr)) return cloudArr;
  if (!Array.isArray(cloudArr)) return localArr;
  const map = new Map();
  localArr.forEach((item) => map.set(item.id, item));
  cloudArr.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

// الدالة بقت بتجيب الـ ID المحمي بتاع المستخدم الحالي
function getCurrentUserId() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

export async function dbGetSaaS(collectionName) {
  const teacherId = getCurrentUserId();
  if (!teacherId) return null; // لو مش مسجل دخول، متجيبش حاجة

  const k = `saas-${teacherId}-${collectionName}`;
  try {
    const localRaw = localStorage.getItem(k);
    let localValue = null,
      localTs = 0;
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        if (parsed && typeof parsed === "object" && "_v" in parsed) {
          localValue = parsed._v;
          localTs = parsed._ts || 0;
        } else {
          localValue = parsed;
        }
      } catch {}
    }

    const docPath = doc(db, "teachers", teacherId, collectionName, "data");
    try {
      const docSnap = await getDoc(docPath);
      if (docSnap.exists()) {
        const data = docSnap.data(),
          cloudTs = data.updatedAt || 0;
        if (collectionName === "sessions") {
          const mergedValue = mergeArraysById(
            localValue || [],
            data.value || []
          );
          localStorage.setItem(
            k,
            JSON.stringify({ _v: mergedValue, _ts: Math.max(cloudTs, localTs) })
          );
          return mergedValue;
        }
        if (cloudTs >= localTs) {
          localStorage.setItem(
            k,
            JSON.stringify({ _v: data.value, _ts: cloudTs })
          );
          return data.value;
        }
      }
    } catch (fbError) {
      console.warn("Firebase Read Alert:", fbError);
    }
    return localValue;
  } catch {
    return null;
  }
}

export async function dbSetSaaS(collectionName, value) {
  const teacherId = getCurrentUserId();
  if (!teacherId) return; // حماية إضافية

  const k = `saas-${teacherId}-${collectionName}`;
  try {
    const ts = Date.now();
    localStorage.setItem(k, JSON.stringify({ _v: value, _ts: ts }));
    const docPath = doc(db, "teachers", teacherId, collectionName, "data");
    try {
      await setDoc(docPath, { value, updatedAt: ts }, { merge: true });
    } catch (fbError) {
      console.warn("Firebase Write Alert:", fbError);
    }
  } catch (e) {
    console.error("Local Save Error:", e);
  }
}

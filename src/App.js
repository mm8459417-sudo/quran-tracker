import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// عملتلك لوحة تحكم (Dashboard) مؤقتة عشان الموقع ميجيبش إيرور لحد ما نبرمج الأساسية
const Dashboard = ({ user, onLogout }) => (
  <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir="rtl">
    <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-md">
      <h1 className="text-3xl font-bold mb-4 text-green-800">أهلاً بك يا بطل!</h1>
      <p className="mb-6 text-gray-600 font-bold">
        تم تسجيل الدخول بنجاح بحساب: <br/> 
        <span className="text-green-600">{user.email}</span>
      </p>
      <button 
        onClick={onLogout} 
        className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition duration-300 shadow-md"
      >
        تسجيل الخروج
      </button>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ده الساحر بتاع فايربيز اللي بيراقب المستخدم وبيفتكره حتى لو قفل الموقع وفتحه تاني
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // بنقفل شاشة التحميل أول ما نتأكد من حالة المستخدم
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  // شاشة تحميل سريعة بتظهر في الجزء من الثانية اللي الموقع بيتأكد فيه من فايربيز
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-green-500 text-2xl font-bold animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div>
      {/* لو مفيش مستخدم، اعرض صفحة اللوجين.. ولو فيه، اعرض الداشبورد */}
      {!user ? (
        <Login onLoginSuccess={() => console.log("تم الدخول!")} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

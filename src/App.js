import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // دي الذاكرة اللي بتسأل فايربيز أول ما الموقع يحمل
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // بنقفل شاشة التحميل أول ما فايربيز يرد
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

  // شاشة الانتظار عشان الموقع ميرمش للوجين قبل ما يتأكد
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-green-500 text-2xl font-bold animate-pulse">جاري استرجاع البيانات...</div>
      </div>
    );
  }

  return (
    <div>
      {!user ? (
        <Login onLoginSuccess={() => console.log("تم الدخول")} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

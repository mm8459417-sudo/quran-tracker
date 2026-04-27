import React, { useState, useRef, useEffect } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // 1. مصفوفة الـ Refs عشان نتحكم في الـ 4 فيديوهات مع بعض
  const videoRefs = useRef([]);

  const videos = ["/vid1.mp4", "/vid2.mp4", "/vid3.mp4", "/vid4.mp4"];

  // 2. دالة النقل للفيديو اللي بعده
  const handleVideoEnd = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  // 3. الخدعة السحرية: بنشغل الفيديو الحالي ونوقف الباقي ونرجعهم للصفر في الخلفية
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideoIndex) {
          video.play().catch((e) => console.log("Video play error:", e));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentVideoIndex]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError("خطأ في البريد الإلكتروني أو كلمة المرور");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError("حدث خطأ أثناء تسجيل الدخول بجوجل");
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
      dir="rtl"
    >
      {/* 4. بنعمل Loop عشان نرسم الـ 4 فيديوهات فوق بعض */}
      {videos.map((vid, index) => (
        <video
          key={vid}
          ref={(el) => (videoRefs.current[index] = el)} // بنربط كل فيديو بالـ Ref بتاعه
          src={vid}
          muted
          playsInline
          onEnded={handleVideoEnd}
          // اللي عليه الدور بياخد opacity-70 ويظهر، والباقي opacity-0 ومستخبي ورا
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentVideoIndex ? "opacity-70 z-0" : "opacity-0 -z-10"
          }`}
        />
      ))}

      <div className="absolute z-10 inset-0 bg-black bg-opacity-60"></div>

      <div className="relative z-20 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex justify-center mb-4">
          <svg
            className="w-16 h-16 text-green-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-center text-green-800 mb-2">
          Quran tracking for tutors
        </h2>

        <p className="text-center text-gray-600 mb-8 font-medium">
          سجل دخول لإدارة جميع حلقاتك
        </p>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-right">
              البريد الإلكتروني:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-right"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-right">
              كلمة المرور:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-right"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="border-b w-1/5 lg:w-1/4"></span>
          <span className="text-xs text-center text-gray-500 uppercase">
            أو سجل دخول بواسطة
          </span>
          <span className="border-b w-1/5 lg:w-1/4"></span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300 shadow-sm"
        >
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;

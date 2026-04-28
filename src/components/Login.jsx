import React, { useState, useRef, useEffect } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";

const Login = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef([]);

  const videos = ["/vid1.mp4", "/vid2.mp4", "/vid3.mp4"];

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideoIndex) {
          video.play().catch((e) => console.log("Video error:", e));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentVideoIndex]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      if (err.code === "auth/user-not-found") setError("هذا الحساب غير موجود");
      else if (err.code === "auth/wrong-password") setError("كلمة المرور خطأ");
      else if (err.code === "auth/invalid-credential") setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      else if (err.code === "auth/email-already-in-use") setError("هذا الإيميل مسجل بالفعل");
      else setError(err.message); // هيعرض الخطأ الحقيقي من السيرفر
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message); // هيعرض الخطأ الحقيقي من السيرفر
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black" dir="rtl">
      {videos.map((vid, index) => (
        <video
          key={vid}
          ref={(el) => (videoRefs.current[index] = el)}
          src={vid}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentVideoIndex ? "opacity-70 z-0" : "opacity-0 -z-10"
          }`}
        />
      ))}

      <div className="absolute z-10 inset-0 bg-black/60"></div>

      <div className="relative z-20 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <h2 className="text-3xl font-bold text-center text-green-800 mb-6">
          {isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
        </h2>

        {/* اتجاه النص هنا من اليسار لليمين عشان لو ظهر إيرور بالإنجليزي يتقري صح */}
        {error && <p className="text-red-500 text-sm text-center mb-4 font-bold" dir="ltr">{error}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="البريد الإلكتروني"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="كلمة المرور"
            required
          />
          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg transition"
          >
            {isSignUp ? "تسجيل" : "دخول"}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-white border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition font-bold text-gray-700"
        >
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
        </button>

        <p className="text-center mt-6 text-gray-600 text-sm">
          {isSignUp ? "لديك حساب؟" : "ليس لديك حساب؟"}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-green-700 font-bold mr-2 underline"
          >
            {isSignUp ? "سجل دخولك" : "أنشئ حساباً"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

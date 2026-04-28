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
          video.play().catch(e => console.log("Video error:", e));
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
      else setError("حدث خطأ في العملية");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError("فشل تسجيل الدخول بجوجل");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black" dir="rtl">
      {videos.map((vid, index) => (
        <video
          key={vid}
          ref={(el) => (videoRefs.current[index] = el)}
          src={vid}
          autoPlay muted playsInline
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

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right"
            placeholder="البريد الإلكتروني"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right"
            placeholder="كلمة المرور"
            required
          />
          <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg transition">
            {isSignUp ? "تسجيل" : "دخول"}
          </button>
        </form>

        <button onClick={handleGoogleLogin} className="w-full mt-4 bg-white border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <span>Google</span>
        </button>

        <p className="text-center mt-6 text-gray-600">
          {isSignUp ? "لديك حساب؟" : "ليس لديك حساب؟"}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-green-700 font-bold mr-2 underline">
            {isSignUp ? "سجل دخولك" : "أنشئ حساباً"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

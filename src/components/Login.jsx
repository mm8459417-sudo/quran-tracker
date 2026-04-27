import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/db";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#1C1C2E",
    outline: "none",
    marginBottom: "16px",
    fontFamily: "inherit",
    fontSize: "15px",
    direction: "ltr",
  };

  return (
    <div
      className="auth-wrap"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: "20px",
        direction: "rtl",
        fontFamily: "Tajawal, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: "400px",
          padding: "30px 20px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "50px", marginBottom: "10px" }}>📿</div>
        <h1
          style={{
            margin: "0 0 5px",
            fontSize: "24px",
            color: "#0D5C3A",
            fontFamily: "Amiri, serif",
          }}
        >
          Quran Tracker
        </h1>
        <p style={{ margin: "0 0 25px", fontSize: "14px", color: "#6b7280" }}>
          سجل دخول لإدارة أكاديميتك
        </p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#9B1D3A",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "15px",
              fontWeight: 700,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ textAlign: "right" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#4b5563",
                marginBottom: "6px",
                display: "block",
              }}
            >
              البريد الإلكتروني:
            </label>
            <input
              type="email"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />

            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#4b5563",
                marginBottom: "6px",
                display: "block",
              }}
            >
              كلمة المرور:
            </label>
            <input
              type="password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: "#0D5C3A",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {loading ? "⏳ جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div style={{ marginTop: "20px", fontSize: "12px", color: "#9ca3af" }}>
          SaaS Edition - Secured by Firebase
        </div>
      </div>
    </div>
  );
}

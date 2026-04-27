import React, { useState } from "react";
import { useAppStore } from "./store/useAppStore";
import SettingsTab from "./components/SettingsTab";
import SessionForm from "./components/SessionForm";
import HistoryView from "./components/HistoryView";
import MonthlySheetTab from "./components/MonthlySheetTab";
import AnalysisTab from "./components/AnalysisTab";
import Login from "./components/Login";

export default function App() {
  const {
    user,
    authResolved,
    ready,
    students,
    sessions,
    settings,
    addStudent,
    updateStudent,
    deleteStudent,
    addSession,
    handleLogout,
    setSettings,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState("form");

  // شاشة تحميل مبدئية لحد ما الفايربيز يتأكد من حالة الدخول
  if (!authResolved)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3f4f6",
          fontSize: "40px",
        }}
      >
        📿
      </div>
    );

  // لو مش مسجل دخول، اعرض شاشة الـ Login
  if (!user) return <Login />;

  // شاشة تحميل الداتا بعد تسجيل الدخول
  if (!ready)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3f4f6",
          fontSize: "40px",
          color: "#0D5C3A",
        }}
      >
        ⏳
      </div>
    );

  return (
    <div
      className="layout-box"
      style={{
        fontFamily: "Tajawal, sans-serif",
        direction: "rtl",
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#065f46",
          padding: "14px 15px 11px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              fontFamily: "Amiri, serif",
              color: "#fff",
            }}
          >
            Quran Tracker
          </div>
          <div style={{ fontSize: "11px", color: "#a7f3d0", marginTop: "2px" }}>
            المعلم: {settings.teacherName}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "#fee2e2",
            color: "#9B1D3A",
            border: "none",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          تسجيل الخروج
        </button>
      </div>

      {/* Tabs Navigation */}
      <nav
        style={{
          display: "flex",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {[
          ["form", "📝", "التسجيل"],
          ["history", "📋", "السجلات"],
          ["analysis", "📊", "التحليل"],
          ["monthly", "🗒️", "الجدول"],
          ["settings", "⚙️", "الإعدادات"],
        ].map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              border: "none",
              background: "none",
              padding: "10px 0",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "inherit",
              color: activeTab === key ? "#0D5C3A" : "#9ca3af",
              borderBottom:
                activeTab === key
                  ? "2px solid #0D5C3A"
                  : "2px solid transparent",
              fontWeight: activeTab === key ? 700 : 500,
            }}
          >
            {icon} <br /> {label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main style={{ padding: "15px", paddingBottom: "60px" }}>
        {activeTab === "form" && (
          <SessionForm
            students={students}
            sessions={sessions}
            addSession={addSession}
            settings={settings}
          />
        )}
        {activeTab === "history" && (
          <HistoryView
            students={students}
            sessions={sessions}
            settings={settings}
          />
        )}
        {activeTab === "analysis" && (
          <AnalysisTab
            students={students}
            sessions={sessions}
            settings={settings}
          />
        )}
        {activeTab === "monthly" && (
          <MonthlySheetTab
            students={students}
            sessions={sessions}
            settings={settings}
          />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            students={students}
            addStudent={addStudent}
            updateStudent={updateStudent}
            deleteStudent={deleteStudent}
            settings={settings}
            setSettings={setSettings}
          />
        )}
      </main>
    </div>
  );
}

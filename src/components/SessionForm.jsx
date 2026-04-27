import React, { useState, useMemo } from "react";

// --- Helper Components ---
const Stars = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: "6px", direction: "ltr" }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        onClick={() => onChange(i === value ? 0 : i)}
        style={{
          fontSize: "24px",
          cursor: "pointer",
          transition: "transform 0.15s",
          filter: value >= i ? "none" : "grayscale(1) opacity(0.35)",
          transform: value >= i ? "scale(1.2)" : "scale(1)",
          userSelect: "none",
        }}
      >
        ⭐
      </span>
    ))}
  </div>
);

const RATINGS = [
  { v: 4, label: "ممتاز ✨", color: "#0D5C3A", bg: "#f0fdf4" },
  { v: 3, label: "جيد جداً 👍", color: "#1d4ed8", bg: "#dbeafe" },
  { v: 2, label: "جيد 🙂", color: "#C9973A", bg: "#FDFAF3" },
  { v: 1, label: "يحتاج مراجعة 📚", color: "#4b5563", bg: "#f3f4f6" },
];

const RatingButtons = ({ currentVal, setter }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginBottom: "10px",
    }}
  >
    {RATINGS.map((r) => (
      <button
        key={r.v}
        onClick={() => setter(currentVal === r.v ? null : r.v)}
        style={{
          border: `1px solid ${currentVal === r.v ? r.color : "#e5e7eb"}`,
          borderRadius: "20px",
          padding: "6px 12px",
          fontSize: "12px",
          fontWeight: currentVal === r.v ? 700 : 500,
          background: currentVal === r.v ? r.bg : "#fff",
          color: currentVal === r.v ? r.color : "#6b7280",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {r.label}
      </button>
    ))}
  </div>
);

// --- Main Component ---
export default function SessionForm({
  students,
  sessions,
  addSession,
  settings,
}) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [sessionType, setSessionType] = useState("quran"); // 'quran' or 'islamic'
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Quran Form State
  const [hifzText, setHifzText] = useState("");
  const [hifzRating, setHifzRating] = useState(null);
  const [recentText, setRecentText] = useState("");
  const [distantText, setDistantText] = useState("");
  const [att, setAtt] = useState(0);
  const [inter, setInter] = useState(0);
  const [ach, setAch] = useState(0);

  // Islamic Form State
  const [islamicGeneral, setIslamicGeneral] = useState("");

  const student = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  // Calculate Package Count
  const currentPackageSessionNum = useMemo(() => {
    if (!student) return 0;
    const stuSessions = sessions.filter((s) => s.studentId === student.id);
    const limit = student.sessionLimit || settings.defaultLimit || 12;
    const count = stuSessions.length;
    return (count % limit) + 1;
  }, [student, sessions, settings.defaultLimit]);

  const handleSave = async () => {
    if (!student) return alert("الرجاء اختيار الطالب أولاً");
    if (sessionType === "quran" && !hifzText.trim())
      return alert("الرجاء إدخال نص التسميع");

    const overall =
      att + inter + ach > 0
        ? Math.round(((att + inter + ach) / 3) * 10) / 10
        : 0;

    const sessionData = {
      studentId: student.id,
      studentName: student.name,
      date,
      dateAr: new Date(date).toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      sessionType,
      packageSessionNum: currentPackageSessionNum,
      overall,
      hifz:
        sessionType === "quran" ? { text: hifzText, rating: hifzRating } : null,
      recent: sessionType === "quran" ? { text: recentText } : null,
      distant: sessionType === "quran" ? { text: distantText } : null,
      islamic: sessionType === "islamic" ? { general: islamicGeneral } : null,
      scores: { att, inter, ach },
    };

    await addSession(sessionData);
    alert("🎉 تم تسجيل الجلسة بنجاح!");

    // Reset Form
    setHifzText("");
    setHifzRating(null);
    setRecentText("");
    setDistantText("");
    setAtt(0);
    setInter(0);
    setAch(0);
    setIslamicGeneral("");
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  };
  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#1C1C2E",
    outline: "none",
    marginBottom: "12px",
    fontFamily: "inherit",
  };
  const sectionHeader = (icon, title) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
      }}
    >
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span style={{ fontSize: "15px", fontWeight: 700, color: "#0D5C3A" }}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="form-layout-wrap" style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Type Toggle */}
      <div
        style={{ ...cardStyle, display: "flex", gap: "8px", padding: "10px" }}
      >
        <button
          onClick={() => setSessionType("quran")}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border:
              sessionType === "quran"
                ? "2px solid #0D5C3A"
                : "1px solid #e5e7eb",
            background: sessionType === "quran" ? "#f0fdf4" : "#fff",
            color: sessionType === "quran" ? "#0D5C3A" : "#9ca3af",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          📿 تسجيل قرآن
        </button>
        <button
          onClick={() => setSessionType("islamic")}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border:
              sessionType === "islamic"
                ? "2px solid #C9973A"
                : "1px solid #e5e7eb",
            background: sessionType === "islamic" ? "#FDFAF3" : "#fff",
            color: sessionType === "islamic" ? "#C9973A" : "#9ca3af",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          📘 تربية إسلامية
        </button>
      </div>

      {/* Student & Date */}
      <div style={cardStyle}>
        {sectionHeader("👤", "بيانات الجلسة")}

        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          style={{
            ...inputStyle,
            fontWeight: selectedStudentId ? 700 : 500,
            color: selectedStudentId ? "#0D5C3A" : "#6b7280",
            background: selectedStudentId ? "#f0fdf4" : "#f9fafb",
            border: selectedStudentId
              ? "1px solid #6ee7b7"
              : "1px solid #e5e7eb",
            cursor: "pointer",
          }}
        >
          <option value="">اضغط لاختيار الطالب...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {student && (
          <div
            style={{
              background: "#FDFAF3",
              border: "1px solid #C9973A",
              borderRadius: "10px",
              padding: "10px",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "13px", color: "#92400e", fontWeight: 700 }}
            >
              الحلقة رقم ({currentPackageSessionNum}) في الباقة
            </span>
            <span
              style={{
                fontSize: "12px",
                background: "#C9973A",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: 700,
              }}
            >
              سعة الباقة: {student.sessionLimit || settings.defaultLimit}
            </span>
          </div>
        )}

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            ...inputStyle,
            marginBottom: 0,
            fontWeight: 700,
            color: "#0D5C3A",
          }}
        />
      </div>

      {/* Form Fields Based on Type */}
      {selectedStudentId && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {sessionType === "quran" ? (
            <>
              <div style={cardStyle}>
                {sectionHeader("✨", "التسميع الجديد")}
                <input
                  style={inputStyle}
                  value={hifzText}
                  onChange={(e) => setHifzText(e.target.value)}
                  placeholder="السور / الآيات التي تم تسميعها..."
                />
                <RatingButtons currentVal={hifzRating} setter={setHifzRating} />
              </div>
              <div style={cardStyle}>
                {sectionHeader("🔄", "الماضي القريب")}
                <input
                  style={{ ...inputStyle, marginBottom: 0 }}
                  value={recentText}
                  onChange={(e) => setRecentText(e.target.value)}
                  placeholder="السورة / الآيات..."
                />
              </div>
              <div style={cardStyle}>
                {sectionHeader("🕰️", "الماضي البعيد")}
                <input
                  style={{ ...inputStyle, marginBottom: 0 }}
                  value={distantText}
                  onChange={(e) => setDistantText(e.target.value)}
                  placeholder="السورة / الآيات..."
                />
              </div>
            </>
          ) : (
            <div style={cardStyle}>
              {sectionHeader("📘", "تفاصيل الحصة")}
              <textarea
                style={{
                  ...inputStyle,
                  height: "80px",
                  resize: "none",
                  marginBottom: 0,
                }}
                value={islamicGeneral}
                onChange={(e) => setIslamicGeneral(e.target.value)}
                placeholder="وصف عام لما تم في حصة التربية الإسلامية..."
              />
            </div>
          )}

          <div style={cardStyle}>
            {sectionHeader("📊", "التقييم العام للحصة")}
            {[
              ["الحضور والانتباه 👁️", att, setAtt],
              ["التفاعل والمشاركة 💬", inter, setInter],
              ["الإنجاز الكلي 🏆", ach, setAch],
            ].map(([label, val, setter]) => (
              <div
                key={label}
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#4b5563",
                  }}
                >
                  {label}
                </span>
                <Stars value={val} onChange={setter} />
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            style={{
              width: "100%",
              padding: "16px",
              background: "#0D5C3A",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(13, 92, 58, 0.2)",
              transition: "transform 0.1s",
            }}
          >
            💾 حفظ وتسجيل الجلسة
          </button>
        </div>
      )}
    </div>
  );
}

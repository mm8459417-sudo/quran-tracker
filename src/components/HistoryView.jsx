import React, { useState, useMemo } from "react";

export default function HistoryView({ students, sessions, settings }) {
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Group sessions by student
  const sessionsByStudent = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.studentId]) map[s.studentId] = [];
      map[s.studentId].push(s);
    }
    // Sort descending (newest first)
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return map;
  }, [sessions]);

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  };

  // --- Student List View ---
  if (!selectedStudent) {
    return (
      <div className="history-wrap" style={{ animation: "fadeUp 0.3s ease" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "20px" }}>📋</span>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#0D5C3A" }}>
            سجلات الطلاب
          </span>
        </div>

        {students.length === 0 ? (
          <div
            style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}
          >
            لا يوجد طلاب مسجلين 📚
          </div>
        ) : (
          students.map((s) => {
            const stuSessions = sessionsByStudent[s.id] || [];
            const limit = s.sessionLimit || settings.defaultLimit || 12;
            const currentCount = stuSessions.length;
            const pkgCount =
              currentCount % limit === 0 && currentCount > 0
                ? limit
                : currentCount % limit;
            const pct = Math.round((pkgCount / limit) * 100);
            const lastSession = stuSessions[0];

            return (
              <div
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                style={{
                  ...cardStyle,
                  cursor: "pointer",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.01)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#0D5C3A",
                    }}
                  >
                    {s.gender === "girl" ? "🧕🏻" : "👦🏻"} {s.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      background: "#f3f4f6",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      color: "#4b5563",
                    }}
                  >
                    إجمالي الجلسات: {currentCount}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  <span>
                    الباقة الحالية:{" "}
                    <span
                      style={{
                        fontWeight: 700,
                        color: pct >= 80 ? "#9B1D3A" : "#C9973A",
                      }}
                    >
                      {pkgCount} / {limit}
                    </span>
                  </span>
                  {lastSession && (
                    <span>
                      آخر حصة:{" "}
                      {lastSession.dateAr.split("،")[1]?.trim() ||
                        lastSession.dateAr}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    height: "6px",
                    background: "#f3f4f6",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, pct)}%`,
                      background: pct >= 100 ? "#9B1D3A" : "#0D5C3A",
                      borderRadius: "3px",
                      transition: "width 0.5s",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // --- Student History Timeline View ---
  const stuSessions = sessionsByStudent[selectedStudent.id] || [];

  return (
    <div className="timeline-wrap" style={{ animation: "fadeUp 0.2s ease" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#0D5C3A" }}>
          سجل {selectedStudent.name}
        </div>
        <button
          onClick={() => setSelectedStudent(null)}
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            padding: "6px 12px",
            borderRadius: "10px",
            fontSize: "13px",
            cursor: "pointer",
            color: "#4b5563",
            fontWeight: 700,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          🔙 رجوع للقائمة
        </button>
      </div>

      {stuSessions.length === 0 ? (
        <div
          style={{ textAlign: "center", color: "#9ca3af", padding: "30px 0" }}
        >
          لا توجد جلسات مسجلة لهذا الطالب بعد.
        </div>
      ) : (
        stuSessions.map((s) => (
          <div
            key={s.id}
            style={{
              ...cardStyle,
              borderRight: `4px solid ${
                s.sessionType === "islamic" ? "#C9973A" : "#0D5C3A"
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", gap: "6px", alignItems: "center" }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#fff",
                    background:
                      s.sessionType === "islamic" ? "#C9973A" : "#0D5C3A",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontWeight: 700,
                  }}
                >
                  حصة {s.packageSessionNum}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    background:
                      s.sessionType === "islamic" ? "#FDFAF3" : "#f0fdf4",
                    color: s.sessionType === "islamic" ? "#C9973A" : "#0D5C3A",
                    padding: "4px 8px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    border: `1px solid ${
                      s.sessionType === "islamic" ? "#fcd34d" : "#6ee7b7"
                    }`,
                  }}
                >
                  {s.sessionType === "islamic" ? "📘 تربية" : "📿 قرآن"}
                </span>
              </div>
              <span
                style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}
              >
                {s.dateAr}
              </span>
            </div>

            {s.sessionType === "islamic" ? (
              <div
                style={{
                  fontSize: "13px",
                  color: "#1C1C2E",
                  lineHeight: 1.6,
                  background: "#f9fafb",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                <strong style={{ color: "#92400e" }}>📘 تفاصيل:</strong>{" "}
                {s.islamic?.general || "—"}
              </div>
            ) : (
              <div
                style={{
                  background: "#f9fafb",
                  padding: "10px",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {s.hifz?.text && (
                  <div style={{ fontSize: "13px" }}>
                    <strong style={{ color: "#0D5C3A" }}>✨ تسميع:</strong>{" "}
                    {s.hifz.text}
                  </div>
                )}
                {s.recent?.text && (
                  <div style={{ fontSize: "13px" }}>
                    <strong style={{ color: "#1d4ed8" }}>🔄 قريب:</strong>{" "}
                    {s.recent.text}
                  </div>
                )}
                {s.distant?.text && (
                  <div style={{ fontSize: "13px" }}>
                    <strong style={{ color: "#C9973A" }}>🕰️ بعيد:</strong>{" "}
                    {s.distant.text}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px dashed #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#4b5563",
                  fontWeight: 700,
                  background: "#FDFAF3",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid #C9973A",
                }}
              >
                التقييم: ⭐ {s.overall} / 5
              </div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                (سيتم تفعيل التعديل والتقارير لاحقاً)
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

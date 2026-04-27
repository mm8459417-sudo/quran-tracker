import React, { useState, useMemo, useRef } from "react";
import {
  captureElement,
  freezeAnimations,
  loadJsPdf,
} from "../utils/exportUtils";

export default function MonthlySheetTab({ students, sessions, settings }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [subTab, setSubTab] = useState("sheet");
  const sheetRef = useRef(null);

  const counts = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!s.date) continue;
      const d = new Date(s.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        map[s.studentId] = (map[s.studentId] || 0) + 1;
      }
    }
    return map;
  }, [sessions, year, month]);

  const getMonthLabel = (y, m) => {
    try {
      return new Date(y, m - 1, 1).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return `${y}/${m}`;
    }
  };

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  const totalSessions = students.reduce(
    (sum, st) => sum + (counts[st.id] || 0),
    0
  );

  // 🚀 وظائف استخراج الشيت
  const copyAsText = () => {
    const lines = [
      `📋 شيت حضور حلقة القرآن الكريم`,
      `📅 ${getMonthLabel(year, month)}`,
      `المعلم: ${settings.teacherName}`,
      `─────────────────────────`,
      ...students.map((s, i) => {
        const c = counts[s.id] || 0;
        const lim = s.sessionLimit || settings.defaultLimit || 12;
        return `${i + 1}. ${s.name}   ${c} / ${lim} حصة`;
      }),
      `─────────────────────────`,
      `الإجمالي: ${totalSessions} حصة`,
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => alert("✅ تم نسخ الشيت للواتساب!"))
      .catch(() => alert("❌ خطأ في النسخ. المتصفح قد يمنع ذلك."));
  };

  const downloadSheetImage = async () => {
    if (!sheetRef.current) return;
    alert("⏳ جاري تجهيز الصورة بجودة عالية...");
    try {
      const restore = freezeAnimations(sheetRef.current);
      const dataUrl = await captureElement(sheetRef.current, 3); // جودة 3K
      restore();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `شيت_حسابات_${getMonthLabel(year, month).replace(
        /\s/g,
        "_"
      )}.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
  };

  const downloadSheetPdf = async () => {
    if (!sheetRef.current) return;
    alert("⏳ جاري إنشاء ملف الـ PDF...");
    try {
      // ✅ السطر ده اللي اتعدل (ضفنا الأقواس)
      const { jsPDF } = await loadJsPdf();

      const restore = freezeAnimations(sheetRef.current);
      const dataUrl = await captureElement(sheetRef.current, 3);
      restore();

      // إعدادات الـ PDF (A4 - Portrait)
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      // حساب الطول بناءً على نسبة العرض عشان الصورة متمطش
      const pdfHeight =
        (sheetRef.current.offsetHeight * pdfWidth) /
        sheetRef.current.offsetWidth;

      pdf.addImage(dataUrl, "PNG", 0, 5, pdfWidth, pdfHeight);
      pdf.save(
        `شيت_حسابات_${getMonthLabel(year, month).replace(/\s/g, "_")}.pdf`
      );
    } catch (e) {
      console.error(e);
      alert("❌ حدث خطأ أثناء إنشاء الـ PDF");
    }
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  };

  return (
    <div className="monthly-wrap" style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Sub-tab navigation */}
      <div
        style={{
          display: "flex",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "4px",
          marginBottom: "16px",
          gap: "4px",
        }}
      >
        {[
          ["sheet", "📋", "الشيت الشهري"],
          ["schedule", "🗓️", "الجدول الأسبوعي"],
        ].map(([k, em, lb]) => (
          <button
            key={k}
            onClick={() => setSubTab(k)}
            style={{
              flex: 1,
              border: "none",
              borderRadius: "9px",
              padding: "10px",
              fontSize: "13px",
              fontFamily: "inherit",
              cursor: "pointer",
              fontWeight: subTab === k ? 700 : 500,
              background: subTab === k ? "#0D5C3A" : "transparent",
              color: subTab === k ? "#fff" : "#9ca3af",
              transition: "all 0.2s",
            }}
          >
            {em} {lb}
          </button>
        ))}
      </div>

      {subTab === "sheet" && (
        <div style={{ animation: "fadeUp 0.2s ease" }}>
          {/* Month navigation */}
          <div
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FDFAF3",
              border: "1px solid #C9973A",
            }}
          >
            <button
              onClick={prevMonth}
              style={{
                background: "#fff",
                border: "1px solid #C9973A",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "18px",
                cursor: "pointer",
                color: "#C9973A",
                fontWeight: "bold",
              }}
            >
              ‹
            </button>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "18px", fontWeight: 700, color: "#0D5C3A" }}
              >
                {getMonthLabel(year, month)}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#92400e",
                  fontWeight: 700,
                  marginTop: "4px",
                }}
              >
                إجمالي الحصص: {totalSessions}
              </div>
            </div>
            <button
              onClick={nextMonth}
              style={{
                background: "#fff",
                border: "1px solid #C9973A",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "18px",
                cursor: "pointer",
                color: "#C9973A",
                fontWeight: "bold",
              }}
            >
              ›
            </button>
          </div>

          {/* 🎯 الجزء اللي هيتصور (sheetRef) */}
          <div
            ref={sheetRef}
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              marginBottom: "16px",
              direction: "rtl",
              padding: "2px",
            }}
          >
            <div
              style={{
                background: "#0D5C3A",
                color: "#fff",
                padding: "16px",
                textAlign: "center",
                borderTopLeftRadius: "10px",
                borderTopRightRadius: "10px",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: 700 }}>
                شيت حضور حلقة القرآن الكريم
              </div>
              <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "4px" }}>
                {getMonthLabel(year, month)} · المعلم: {settings.teacherName}
              </div>
            </div>

            {students.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#9ca3af",
                  padding: "40px 0",
                  fontSize: "14px",
                }}
              >
                أضف طلاباً من الإعدادات أولاً
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "400px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f0fdf4" }}>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#0D5C3A",
                          borderBottom: "2px solid #0D5C3A",
                          width: "40px",
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#0D5C3A",
                          borderBottom: "2px solid #0D5C3A",
                        }}
                      >
                        الطالب
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#0D5C3A",
                          borderBottom: "2px solid #0D5C3A",
                          width: "100px",
                        }}
                      >
                        الحضور
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#0D5C3A",
                          borderBottom: "2px solid #0D5C3A",
                          minWidth: "150px",
                        }}
                      >
                        التقدم في الباقة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const c = counts[s.id] || 0;
                      const lim = s.sessionLimit || settings.defaultLimit || 12;
                      const pct = Math.round((c / lim) * 100);
                      const barColor =
                        pct >= 100
                          ? "#9B1D3A"
                          : pct >= 75
                          ? "#C9973A"
                          : "#0D5C3A";

                      return (
                        <tr
                          key={s.id}
                          style={{
                            background: i % 2 === 0 ? "#fff" : "#f9fafb",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              fontSize: "13px",
                              color: "#9ca3af",
                              textAlign: "center",
                            }}
                          >
                            {i + 1}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#1C1C2E",
                            }}
                          >
                            {s.name}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: c >= lim ? "#9B1D3A" : "#0D5C3A",
                              }}
                            >
                              {c} / {lim}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "11px",
                                color: "#6b7280",
                                marginBottom: "4px",
                              }}
                            >
                              <span>{pct}%</span>
                              <span>
                                {c >= lim ? "✅ مكتمل" : `${lim - c} متبقي`}
                              </span>
                            </div>
                            <div
                              style={{
                                height: "8px",
                                background: "#e5e7eb",
                                borderRadius: "4px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${Math.min(100, pct)}%`,
                                  background: barColor,
                                  borderRadius: "4px",
                                  transition: "width 0.4s",
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr
                      style={{
                        background: "#FDFAF3",
                        borderTop: "2px solid #C9973A",
                      }}
                    >
                      <td
                        colSpan={2}
                        style={{
                          padding: "14px 12px",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#92400e",
                        }}
                      >
                        الإجمالي الكلي للشهر
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          padding: "14px 12px",
                          textAlign: "center",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#92400e",
                        }}
                      >
                        {totalSessions} حصة
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* زراير الاستخراج */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <button
              onClick={downloadSheetPdf}
              style={{
                background: "#0D5C3A",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              📄 حفظ كـ PDF
            </button>
            <button
              onClick={downloadSheetImage}
              style={{
                background: "#C9973A",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              🖼️ حفظ كصورة
            </button>
          </div>
          <button
            onClick={copyAsText}
            style={{
              width: "100%",
              marginTop: "8px",
              background: "#f0fdf4",
              color: "#0D5C3A",
              border: "1px dashed #6ee7b7",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            📋 نسخ ملخص الشيت للواتساب
          </button>
        </div>
      )}

      {subTab === "schedule" && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#6b7280",
            ...cardStyle,
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🗓️</div>
          الجدول الأسبوعي يعمل من إعدادات الطالب حالياً
          <br />
          سيتم عرض الجدول المجمع هنا لاحقاً
        </div>
      )}
    </div>
  );
}

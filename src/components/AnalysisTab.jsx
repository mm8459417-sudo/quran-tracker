import React, { useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  captureElement,
  freezeAnimations,
  loadGifJs,
  dataUrlToCanvas,
} from "../utils/exportUtils";

export default function AnalysisTab({ students, sessions, settings }) {
  const [analysisStudent, setAnalysisStudent] = useState("all");
  const [analysisRange, setAnalysisRange] = useState("all");
  const [showReward, setShowReward] = useState(null);
  const [rewardAmount, setRewardAmount] = useState("");
  const certRef = useRef(null);

  const selectedId = analysisStudent === "all" ? null : analysisStudent;

  const baseSessions = useMemo(() => {
    if (selectedId === null) return sessions;
    return sessions
      .filter((s) => s.studentId === selectedId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sessions, selectedId]);

  const targetSessions = useMemo(() => {
    const now = Date.now();
    if (analysisRange === "week")
      return baseSessions.filter(
        (s) => new Date(s.date).getTime() >= now - 7 * 86400000
      );
    if (analysisRange === "month")
      return baseSessions.filter(
        (s) => new Date(s.date).getTime() >= now - 30 * 86400000
      );
    return baseSessions;
  }, [baseSessions, analysisRange]);

  const { wAvg, mAvg, stuObj } = useMemo(() => {
    let w = 0,
      m = 0,
      obj = null;
    if (selectedId !== null) {
      obj = students.find((s) => s.id === selectedId);
      const calcAvg = (arr) =>
        arr.length
          ? arr.reduce((sum, s) => sum + (s.overall || 0), 0) / arr.length
          : 0;
      const now = Date.now();
      w = calcAvg(
        baseSessions.filter(
          (s) => new Date(s.date).getTime() >= now - 7 * 86400000
        )
      );
      m = calcAvg(
        baseSessions.filter(
          (s) => new Date(s.date).getTime() >= now - 30 * 86400000
        )
      );
    }
    return { wAvg: w, mAvg: m, stuObj: obj };
  }, [selectedId, students, baseSessions]);

  const chartData = targetSessions
    .slice(-20)
    .map((s, i) => ({ name: i + 1, overall: s.overall || 0 }));

  // 🚀 وظائف استخراج الشهادة
  const downloadCertificateImage = async () => {
    if (!certRef.current) return;
    alert("⏳ جاري تجهيز الشهادة بجودة عالية...");
    try {
      const restore = freezeAnimations(certRef.current);
      const dataUrl = await captureElement(certRef.current, 4); // جودة 4K
      restore();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `شهادة_${showReward.name}.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("❌ حدث خطأ أثناء حفظ الصورة");
    }
  };

  const exportGif = async () => {
    if (!certRef.current) return;
    alert("⏳ جاري إنشاء الـ GIF المتحرك (قد يستغرق بضع ثواني)...");
    try {
      const workerUrl = await loadGifJs();
      const el = certRef.current;
      const SCALE = 1.5,
        W = Math.round(el.scrollWidth * SCALE),
        H = Math.round(el.scrollHeight * SCALE);
      const gif = new window.GIF({
        workers: 2,
        quality: 10,
        width: W,
        height: H,
        workerScript: workerUrl,
        background: "#ffffff",
      });

      const FRAME_COUNT = 15,
        FRAME_DELAY = 120;
      for (let i = 0; i < FRAME_COUNT; i++) {
        await new Promise((r) => setTimeout(r, FRAME_DELAY));
        const dataUrl = await captureElement(el, SCALE);
        const canvas = await dataUrlToCanvas(dataUrl, W, H);
        gif.addFrame(canvas, { delay: FRAME_DELAY, copy: true });
      }

      gif.on("finished", (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `شهادة_${showReward.name}.gif`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 6000);
      });
      gif.render();
    } catch (e) {
      console.error(e);
      alert("❌ فشل إنشاء الـ GIF");
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

  return (
    <div className="analysis-wrap" style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Filters */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <span style={{ fontSize: "18px" }}>🎯</span>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#0D5C3A" }}>
            تخصيص التحليل
          </span>
        </div>

        <select
          value={analysisStudent}
          onChange={(e) => setAnalysisStudent(e.target.value)}
          style={{
            ...inputStyle,
            fontWeight: 700,
            color: "#0D5C3A",
            background: "#f0fdf4",
            border: "1px solid #6ee7b7",
            cursor: "pointer",
          }}
        >
          <option value="all">📊 إجمالي الأكاديمية (جميع الطلاب)</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              👤 الطالب: {s.name}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: "6px" }}>
          {[
            ["week", "📅 أسبوع", "#dbeafe", "#1d4ed8"],
            ["month", "📆 شهر", "#f0fdf4", "#0D5C3A"],
            ["all", "📊 الكل", "#f3f4f6", "#1C1C2E"],
          ].map(([val, label, bg, fg]) => (
            <button
              key={val}
              onClick={() => setAnalysisRange(val)}
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: "10px",
                border: `1px solid ${analysisRange === val ? fg : "#e5e7eb"}`,
                background: analysisRange === val ? bg : "#f9fafb",
                color: analysisRange === val ? fg : "#6b7280",
                fontSize: "12px",
                fontWeight: analysisRange === val ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {baseSessions.length === 0 ? (
        <div
          style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}
        >
          لا توجد بيانات كافية للتحليل 📊
        </div>
      ) : (
        <>
          {/* Rewards Section */}
          {selectedId !== null && (wAvg >= 4 || mAvg >= 4.5) && (
            <div
              style={{
                background:
                  mAvg >= 4.5
                    ? "linear-gradient(135deg, #FDFAF3, #fffbeb)"
                    : "linear-gradient(135deg, #f0fdf4, #d1fae5)",
                padding: "20px",
                borderRadius: "14px",
                textAlign: "center",
                border: mAvg >= 4.5 ? "1px solid #C9973A" : "1px solid #0D5C3A",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  marginBottom: "8px",
                  fontWeight: 700,
                  color: mAvg >= 4.5 ? "#92400e" : "#0D5C3A",
                }}
              >
                🎉 أداء استثنائي وتفوق! 🎉
              </div>
              <div style={{ marginBottom: "12px", textAlign: "right" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4b5563",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  حدد مبلغ المكافأة (ج.م):
                </label>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  placeholder="مثال: 50"
                  style={{
                    ...inputStyle,
                    marginBottom: 0,
                    direction: "ltr",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                />
              </div>
              <button
                onClick={() =>
                  setShowReward({
                    type: mAvg >= 4.5 ? "month" : "week",
                    name: stuObj.name,
                    amount: rewardAmount,
                    gender: stuObj.gender,
                  })
                }
                style={{
                  width: "100%",
                  background: mAvg >= 4.5 ? "#C9973A" : "#0D5C3A",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "transform 0.1s",
                }}
              >
                {mAvg >= 4.5
                  ? "🏆 إصدار شهادة تفوق الشهر"
                  : "🎁 إصدار شهادة تفوق الأسبوع"}
              </button>
            </div>
          )}

          {/* Chart Section */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "18px" }}>📈</span>
              <span
                style={{ fontSize: "15px", fontWeight: 700, color: "#0D5C3A" }}
              >
                {selectedId === null
                  ? "معدل الإنجاز العام"
                  : `المستوى التحصيلي لـ ${stuObj?.name}`}
              </span>
            </div>

            <div style={{ height: "200px", direction: "ltr" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1C1C2E",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      direction: "rtl",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overall"
                    stroke={selectedId === null ? "#0D5C3A" : "#1d4ed8"}
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: selectedId === null ? "#0D5C3A" : "#1d4ed8",
                    }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            {selectedId === null ? (
              <>
                <div
                  style={{ ...cardStyle, textAlign: "center", marginBottom: 0 }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>
                    👥
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#0D5C3A",
                    }}
                  >
                    {students.length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    إجمالي الطلاب
                  </div>
                </div>
                <div
                  style={{ ...cardStyle, textAlign: "center", marginBottom: 0 }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>
                    📚
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#0D5C3A",
                    }}
                  >
                    {targetSessions.length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    حصص في الفترة
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    ...cardStyle,
                    textAlign: "center",
                    marginBottom: 0,
                    borderTop: "3px solid #0D5C3A",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                    📅
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#0D5C3A",
                    }}
                  >
                    {wAvg.toFixed(1)} / 5
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    متوسط آخر 7 أيام
                  </div>
                </div>
                <div
                  style={{
                    ...cardStyle,
                    textAlign: "center",
                    marginBottom: 0,
                    borderTop: "3px solid #C9973A",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                    📆
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#0D5C3A",
                    }}
                  >
                    {mAvg.toFixed(1)} / 5
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    متوسط آخر 30 يوم
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Reward Modal */}
      {showReward && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28, 28, 46, 0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            direction: "rtl",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {/* الجزء اللي هيتصور (certRef) */}
            <div
              ref={certRef}
              style={{
                padding: "30px 20px",
                background: showReward.type === "month" ? "#FDFAF3" : "#f0fdf4",
                border: `8px solid ${
                  showReward.type === "month" ? "#C9973A" : "#0D5C3A"
                }`,
                textAlign: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "60px",
                  marginBottom: "10px",
                  animation: "celebrate 0.6s ease-out",
                }}
              >
                {showReward.gender === "girl" ? "🧕🏻" : "👦🏻"}
              </div>
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: "28px",
                  fontFamily: "Amiri, serif",
                  color: showReward.type === "month" ? "#92400e" : "#0D5C3A",
                }}
              >
                شهادة شكر وتقدير
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#4b5563",
                  marginBottom: "10px",
                  lineHeight: "1.6",
                }}
              >
                نتقدم بخالص التقدير{" "}
                {showReward.gender === "girl"
                  ? "للفتاة المتميزة"
                  : "للصبي المتميز"}
                :
              </p>

              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#1C1C2E",
                  background: "#fff",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px dashed #C9973A",
                  marginBottom: "15px",
                }}
              >
                {showReward.name}
              </div>

              {showReward.amount && (
                <div
                  style={{
                    marginTop: "15px",
                    background: "#fff",
                    border: "2px solid #C9973A",
                    borderRadius: "12px",
                    padding: "15px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#4b5563",
                      marginBottom: "5px",
                    }}
                  >
                    مكافأة مالية قدرها:
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: "#C9973A",
                    }}
                  >
                    {showReward.amount} ج.م
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: "20px",
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "15px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0D5C3A",
                }}
              >
                المعلم: {settings.teacherName}
              </div>
              <div
                style={{ fontSize: "10px", color: "#9ca3af", marginTop: "5px" }}
              >
                تم الإصدار بواسطة Quran Tracker SaaS
              </div>
            </div>

            {/* زراير التحكم (مش بتظهر في الصورة) */}
            <div
              style={{
                padding: "15px",
                background: "#f9fafb",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={exportGif}
                  style={{
                    flex: 1,
                    background: "#7c3aed",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🎬 تصدير GIF
                </button>
                <button
                  onClick={downloadCertificateImage}
                  style={{
                    flex: 1,
                    background: "#0D5C3A",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ⬇️ حفظ 4K
                </button>
              </div>
              <button
                onClick={() => setShowReward(null)}
                style={{
                  background: "transparent",
                  color: "#6b7280",
                  padding: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

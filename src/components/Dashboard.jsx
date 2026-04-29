import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// ════════════════════════════════════════════════════════════════════════════════
// Error Boundary
// ════════════════════════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Error Boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            direction: "rtl",
            fontFamily: "Tajawal, sans-serif",
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#dc2626",
              marginBottom: 8,
            }}
          >
            حدث خطأ غير متوقع
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 4,
              maxWidth: 300,
              margin: "0 auto 20px",
            }}
          >
            {this.state.error?.message || "خطأ غير معروف"}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#065f46",
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: 10,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🔄 إعادة تحميل التطبيق
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── dbGet / dbSet ─────────────────────────────────────────────────────────────
async function dbGet(k) {
  try {
    const localRaw = localStorage.getItem(k);
    let localValue = null,
      localTs = 0;
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        if (parsed && typeof parsed === "object" && "_v" in parsed) {
          localValue = parsed._v;
          localTs = parsed._ts || 0;
        } else {
          localValue = parsed;
        }
      } catch {}
    }
    try {
      const docSnap = await getDoc(doc(db, "appData", k));
      if (docSnap.exists()) {
        const data = docSnap.data(),
          cloudTs = data.updatedAt || 0;
        if (cloudTs >= localTs) {
          localStorage.setItem(
            k,
            JSON.stringify({ _v: data.value, _ts: cloudTs })
          );
          return data.value;
        }
      }
    } catch (fbError) {
      console.warn("تنبيه فايربيز (جلب):", fbError);
    }
    return localValue;
  } catch {
    return null;
  }
}

async function dbSet(k, v) {
  try {
    const ts = Date.now();
    localStorage.setItem(k, JSON.stringify({ _v: v, _ts: ts }));
    try {
      await setDoc(doc(db, "appData", k), { value: v, updatedAt: ts });
    } catch (fbError) {
      console.warn("تنبيه فايربيز (حفظ):", fbError);
    }
  } catch (e) {
    console.error(e);
  }
}

// ── Lazy loaders ──────────────────────────────────────────────────────────────
let _htmlToImageState = "idle";
function loadHtmlToImage() {
  return new Promise((resolve, reject) => {
    if (_htmlToImageState === "ready") return resolve();
    if (_htmlToImageState === "loading") {
      const iv = setInterval(() => {
        if (_htmlToImageState === "ready") {
          clearInterval(iv);
          resolve();
        }
        if (_htmlToImageState === "idle") {
          clearInterval(iv);
          reject(new Error("فشل التحميل"));
        }
      }, 50);
      return;
    }
    _htmlToImageState = "loading";
    const s = document.createElement("script");
    s.src =
      "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js";
    s.onload = () => {
      _htmlToImageState = "ready";
      resolve();
    };
    s.onerror = () => {
      _htmlToImageState = "idle";
      reject(new Error("فشل تحميل html-to-image"));
    };
    document.head.appendChild(s);
  });
}

let _jsPdfState = "idle";
function loadJsPdf() {
  return new Promise((resolve, reject) => {
    if (_jsPdfState === "ready") return resolve();
    if (_jsPdfState === "loading") {
      const iv = setInterval(() => {
        if (_jsPdfState === "ready") {
          clearInterval(iv);
          resolve();
        }
        if (_jsPdfState === "idle") {
          clearInterval(iv);
          reject(new Error("فشل التحميل"));
        }
      }, 50);
      return;
    }
    _jsPdfState = "loading";
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => {
      _jsPdfState = "ready";
      resolve();
    };
    s.onerror = () => {
      _jsPdfState = "idle";
      reject(new Error("فشل تحميل jsPDF"));
    };
    document.head.appendChild(s);
  });
}

let _gifState = "idle",
  _gifWorkerUrl = null;
async function loadGifJs() {
  if (_gifState === "ready") return _gifWorkerUrl;
  if (_gifState === "loading") {
    await new Promise((resolve, reject) => {
      const iv = setInterval(() => {
        if (_gifState === "ready") {
          clearInterval(iv);
          resolve();
        }
        if (_gifState === "idle") {
          clearInterval(iv);
          reject(new Error("فشل التحميل"));
        }
      }, 50);
    });
    return _gifWorkerUrl;
  }
  _gifState = "loading";
  try {
    if (!window.GIF) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("فشل تحميل gif.js"));
        document.head.appendChild(s);
      });
    }
    if (!_gifWorkerUrl) {
      const res = await fetch(
        "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js"
      );
      if (!res.ok) throw new Error("فشل تحميل gif.worker.js");
      _gifWorkerUrl = URL.createObjectURL(
        new Blob([await res.text()], { type: "text/javascript" })
      );
    }
    _gifState = "ready";
    return _gifWorkerUrl;
  } catch (e) {
    _gifState = "idle";
    throw e;
  }
}

// ── Improved image capture helper ─────────────────────────────────────────────
async function captureElement(el, pixelRatio = 2) {
  await loadHtmlToImage();
  await document.fonts.ready;
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  );

  const opts = {
    backgroundColor: "#ffffff",
    pixelRatio,
    skipFonts: false,
    useCORS: true,
    allowTaint: false,
    cacheBust: true,
  };

  let dataUrl;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      dataUrl = await window.htmlToImage.toPng(el, opts);
      if (dataUrl && dataUrl.length > 1000) break;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return dataUrl;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function freezeAnimations(el) {
  const nodes = [el, ...el.querySelectorAll("*")];
  const saved = nodes.map((n) => ({
    animation: n.style.animation,
    transition: n.style.transition,
    animationPlayState: n.style.animationPlayState,
  }));
  nodes.forEach((n) => {
    n.style.animationPlayState = "paused";
    n.style.transition = "none";
  });
  return () =>
    nodes.forEach((n, i) => {
      n.style.animation = saved[i].animation;
      n.style.transition = saved[i].transition;
      n.style.animationPlayState = saved[i].animationPlayState;
    });
}

function dataUrlToCanvas(dataUrl, w, h) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(c);
    };
    img.src = dataUrl;
  });
}

function Stars({ value, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, direction: "ltr" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(0)}
          onClick={() => onChange(i === value ? 0 : i)}
          tabIndex={0}
          role="button"
          aria-label={`${i} نجوم`}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            onChange(i === value ? 0 : i)
          }
          style={{
            fontSize: 22,
            cursor: "pointer",
            transition: "transform .15s, filter .15s",
            transform: (hov || value) >= i ? "scale(1.25)" : "scale(1)",
            filter: (hov || value) >= i ? "none" : "grayscale(1) opacity(.35)",
            userSelect: "none",
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

function getArDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function getMonthLabel(year, month) {
  try {
    return new Date(year, month - 1, 1).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
  } catch {
    return `${year}/${month}`;
  }
}

function formatTime12h(time24) {
  if (!time24 || typeof time24 !== "string") return "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const suffix = h >= 12 ? "م" : "ص";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

const TAJWEED = [
  "الإدغام",
  "الإخفاء",
  "الإقلاب",
  "الغنة",
  "المدود",
  "الوقف والابتداء",
  "أخرى",
];
const RATINGS = [
  {
    v: 4,
    label: "ممتاز ✨",
    color: "var(--c-primary)",
    bg: "var(--c-primary-light)",
  },
  {
    v: 3,
    label: "جيد جداً 👍",
    color: "var(--c-blue)",
    bg: "var(--c-blue-light)",
  },
  {
    v: 2,
    label: "جيد 🙂",
    color: "var(--c-amber)",
    bg: "var(--c-amber-light)",
  },
  {
    v: 1,
    label: "يحتاج مراجعة 📚",
    color: "var(--color-text-secondary)",
    bg: "var(--color-background-tertiary)",
  },
];
const HIST_PAGE_SIZE = 20;
const PAGE_SIZE_PDF = 10;

// ════════════════════════════════════════════════════════════════════════════════
// Islamic Education Categories
// ════════════════════════════════════════════════════════════════════════════════
const ISLAMIC_CATEGORIES = [
  {
    id: "asma",
    label: "أسماء حسنى",
    icon: "✨",
    fields: [
      { key: "name", label: "الاسم", placeholder: "مثال: الرحمن" },
      { key: "notes", label: "ملاحظات التدبر", placeholder: "ما تم تدبره..." },
    ],
  },
  {
    id: "hadith",
    label: "حديث",
    icon: "📜",
    fields: [
      { key: "text", label: "نص الحديث", placeholder: "نص الحديث الشريف..." },
      { key: "notes", label: "ملاحظات", placeholder: "الشرح والتطبيق..." },
    ],
  },
  {
    id: "prophet",
    label: "قصص الأنبياء",
    icon: "🌟",
    fields: [
      {
        key: "prophet",
        label: "اسم النبي",
        placeholder: "مثال: نوح عليه السلام",
      },
      { key: "notes", label: "الدروس والعبر", placeholder: "ما استفدناه..." },
    ],
  },
  {
    id: "story",
    label: "قصة وعبرة",
    icon: "📖",
    fields: [
      { key: "title", label: "اسم القصة", placeholder: "عنوان القصة..." },
      { key: "lesson", label: "العبرة", placeholder: "العبرة المستفادة..." },
    ],
  },
  {
    id: "sahabi",
    label: "صحابي/صحابية",
    icon: "🏅",
    fields: [
      {
        key: "name",
        label: "اسم الصحابي",
        placeholder: "مثال: أبو بكر الصديق",
      },
      { key: "notes", label: "أبرز الصفات", placeholder: "صفاته ومناقبه..." },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// Schedule helpers
// ════════════════════════════════════════════════════════════════════════════════
const ARABIC_DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function suggestedSlots(limit) {
  const n = parseInt(limit) || 12;
  if (n <= 4) return 1;
  if (n <= 8) return 2;
  if (n <= 12) return 3;
  if (n <= 16) return 4;
  return 5;
}

const DEFAULT_DAY_SETS = {
  1: ["السبت"],
  2: ["السبت", "الثلاثاء"],
  3: ["السبت", "الاثنين", "الأربعاء"],
  4: ["السبت", "الاثنين", "الأربعاء", "الخميس"],
  5: ["السبت", "الأحد", "الاثنين", "الأربعاء", "الخميس"],
};

function defaultSchedule(limit) {
  const count = suggestedSlots(limit);
  return (DEFAULT_DAY_SETS[count] || DEFAULT_DAY_SETS[3]).map((day) => ({
    id: Date.now() + Math.random(),
    day,
    time: "17:00",
  }));
}

function ScheduleEditor({ schedule, onChange, sessionLimit }) {
  const suggested = suggestedSlots(sessionLimit);

  function addSlot() {
    const usedDays = schedule.map((s) => s.day);
    const freeDay = ARABIC_DAYS.find((d) => !usedDays.includes(d)) || "السبت";
    onChange([
      ...schedule,
      { id: Date.now() + Math.random(), day: freeDay, time: "17:00" },
    ]);
  }

  function removeSlot(id) {
    onChange(schedule.filter((s) => s.id !== id));
  }
  function updateSlot(id, field, value) {
    onChange(schedule.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  const I_SM = {
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 13,
    fontFamily: "inherit",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>🗓️</span>
          <span
            style={{ fontSize: 13, fontWeight: 500, color: "var(--c-primary)" }}
          >
            مواعيد الحلقة الأسبوعية
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary)",
            background: "var(--color-background-tertiary)",
            padding: "3px 8px",
            borderRadius: 20,
          }}
        >
          مقترح: {suggested} {suggested === 1 ? "موعد" : "مواعيد"}
        </div>
      </div>

      {schedule.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0",
            fontSize: 12,
            color: "var(--color-text-tertiary)",
            background: "var(--color-background-secondary)",
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          لا توجد مواعيد — اضغط "إضافة موعد" أدناه
        </div>
      )}

      {schedule.map((slot, idx) => (
        <div
          key={slot.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 7,
            background: "var(--color-background-secondary)",
            borderRadius: 10,
            padding: "8px 10px",
            border: "0.5px solid var(--color-border-tertiary)",
            animation: "fadeUp .2s ease",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-tertiary)",
              minWidth: 18,
              textAlign: "center",
            }}
          >
            {idx + 1}
          </span>
          <select
            value={slot.day}
            onChange={(e) => updateSlot(slot.id, "day", e.target.value)}
            style={{ ...I_SM, flex: 1, direction: "rtl" }}
          >
            {ARABIC_DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={slot.time}
            onChange={(e) => updateSlot(slot.id, "time", e.target.value)}
            style={{ ...I_SM, direction: "ltr", minWidth: 88 }}
          />
          <button
            onClick={() => removeSlot(slot.id)}
            aria-label="حذف الموعد"
            style={{
              background: "var(--c-red-light)",
              color: "var(--c-red)",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={addSlot}
        style={{
          width: "100%",
          background: "var(--c-primary-bg)",
          color: "var(--c-primary)",
          border: "1px dashed var(--c-primary-border)",
          borderRadius: 10,
          padding: "8px",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all .15s",
        }}
      >
        ➕ إضافة موعد
      </button>

      {schedule.length > 0 && schedule.length !== suggested && (
        <div
          style={{
            marginTop: 7,
            fontSize: 11,
            color: "var(--c-amber)",
            background: "var(--c-amber-light)",
            borderRadius: 8,
            padding: "5px 10px",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          💡 بناءً على باقة {sessionLimit} حصة، المقترح {suggested}{" "}
          {suggested === 1 ? "موعد" : "مواعيد"} أسبوعياً — أنت اخترت{" "}
          {schedule.length}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Islamic Education Form Component
// ════════════════════════════════════════════════════════════════════════════════
function IslamicCategoryBlock({ catId, data, onChange, onRemove }) {
  const cat = ISLAMIC_CATEGORIES.find((c) => c.id === catId);
  if (!cat) return null;

  const I = {
    width: "100%",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    fontFamily: "inherit",
    direction: "rtl",
    outline: "none",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    boxSizing: "border-box",
    marginBottom: 8,
  };

  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: 12,
        padding: "12px",
        marginBottom: 10,
        border: "0.5px solid var(--color-border-secondary)",
        animation: "fadeUp .2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{ fontSize: 13, fontWeight: 700, color: "var(--c-primary)" }}
        >
          {cat.icon} {cat.label}
        </div>
        <button
          onClick={onRemove}
          style={{
            background: "var(--c-red-light)",
            color: "var(--c-red)",
            border: "none",
            borderRadius: 8,
            width: 28,
            height: 28,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
      {cat.fields.map((field) => (
        <div key={field.key}>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              marginBottom: 3,
            }}
          >
            {field.label}:
          </div>
          <textarea
            value={data[field.key] || ""}
            onChange={(e) => onChange({ ...data, [field.key]: e.target.value })}
            placeholder={field.placeholder}
            style={{ ...I, height: 55, resize: "none", marginBottom: 8 }}
          />
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Weekly Schedule View
// ════════════════════════════════════════════════════════════════════════════════
function WeeklyScheduleView({ students }) {
  const weekRef = useRef(null);

  const daySlots = useMemo(() => {
    const map = {};
    for (const day of ARABIC_DAYS) map[day] = [];
    for (const stu of students) {
      for (const sl of stu.schedule || []) {
        if (map[sl.day]) {
          map[sl.day].push({
            id: sl.id,
            time: sl.time || "00:00",
            studentName: stu.name,
            gender: stu.gender || "boy",
            sessionLimit: stu.sessionLimit || 12,
          });
        }
      }
    }
    for (const day of ARABIC_DAYS) {
      map[day].sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [students]);

  const activeDays = ARABIC_DAYS.filter((d) => daySlots[d].length > 0);
  const totalSlots = activeDays.reduce((sum, d) => sum + daySlots[d].length, 0);
  const maxSlotsInDay = Math.max(
    ...activeDays.map((d) => daySlots[d].length),
    0
  );

  async function saveWeeklyImage() {
    if (!weekRef.current) return;
    try {
      const restore = freezeAnimations(weekRef.current);
      const dataUrl = await captureElement(weekRef.current, 3);
      restore();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `الجدول_الأسبوعي.png`;
      a.click();
    } catch (e) {
      console.error("خطأ في حفظ الجدول:", e);
    }
  }

  async function copyWeeklyAsText() {
    const lines = ["📅 الجدول الأسبوعي للحلقات", "─────────────────────────"];
    for (const day of activeDays) {
      lines.push(`\n${day}:`);
      daySlots[day].forEach((sl, i) => {
        lines.push(`  ${i + 1}. ${formatTime12h(sl.time)} — ${sl.studentName}`);
      });
    }
    lines.push("\n─────────────────────────");
    lines.push(`إجمالي الحلقات الأسبوعية: ${totalSlots}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch (e) {
      console.error(e);
    }
  }

  const C = {
    background: "var(--color-background-primary)",
    borderRadius: 14,
    border: "0.5px solid var(--color-border-tertiary)",
    padding: "14px 15px",
    marginBottom: 10,
  };

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div
        style={{
          ...C,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{ fontSize: 15, fontWeight: 700, color: "var(--c-primary)" }}
          >
            الجدول الأسبوعي
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              marginTop: 2,
            }}
          >
            {activeDays.length}{" "}
            {activeDays.length === 1 ? "يوم نشط" : "أيام نشطة"} · {totalSlots}{" "}
            حلقة أسبوعياً
          </div>
        </div>
        <div style={{ fontSize: 28 }}>🗓️</div>
      </div>

      {totalSlots === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "var(--color-background-primary)",
            borderRadius: 14,
            border: "2px dashed var(--color-border-secondary)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              marginBottom: 6,
            }}
          >
            لا توجد مواعيد مسجلة
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-tertiary)",
              lineHeight: 1.6,
            }}
          >
            أضف مواعيد للطلاب من تبويب الإعدادات ⚙️
          </div>
        </div>
      )}

      {totalSlots > 0 && (
        <>
          <div
            ref={weekRef}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              marginBottom: 10,
              direction: "rtl",
              fontFamily: "'Tajawal', Tahoma, sans-serif",
            }}
          >
            <div
              style={{
                background: "#065f46",
                color: "#fff",
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                الجدول الأسبوعي للحلقات
              </div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
                إجمالي {totalSlots} حلقة · {activeDays.length} أيام نشطة
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: activeDays.length * 120,
                }}
              >
                <thead>
                  <tr>
                    {activeDays.map((day) => (
                      <th
                        key={day}
                        style={{
                          background: "#f0fdf4",
                          color: "#065f46",
                          padding: "10px 8px",
                          fontSize: 13,
                          fontWeight: 700,
                          textAlign: "center",
                          borderBottom: "2px solid #065f46",
                          borderLeft: "1px solid #e5e7eb",
                          minWidth: 120,
                        }}
                      >
                        <div>{day}</div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#6b7280",
                            fontWeight: 400,
                            marginTop: 2,
                          }}
                        >
                          {daySlots[day].length}{" "}
                          {daySlots[day].length === 1 ? "حلقة" : "حلقات"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxSlotsInDay }).map((_, rowIdx) => (
                    <tr
                      key={rowIdx}
                      style={{
                        background: rowIdx % 2 === 0 ? "#fff" : "#f9fafb",
                      }}
                    >
                      {activeDays.map((day) => {
                        const slot = daySlots[day][rowIdx];
                        return (
                          <td
                            key={day}
                            style={{
                              padding: "10px 8px",
                              textAlign: "center",
                              borderBottom: "1px solid #f3f4f6",
                              borderLeft: "1px solid #f3f4f6",
                              verticalAlign: "top",
                            }}
                          >
                            {slot ? (
                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#065f46",
                                    background: "#f0fdf4",
                                    border: "1px solid #6ee7b7",
                                    borderRadius: 20,
                                    padding: "3px 8px",
                                    display: "inline-block",
                                    marginBottom: 4,
                                    direction: "ltr",
                                  }}
                                >
                                  {formatTime12h(slot.time)}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#111827",
                                  }}
                                >
                                  {slot.gender === "girl" ? "♀️" : "♂️"}{" "}
                                  {slot.studentName}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: "#9ca3af",
                                    marginTop: 2,
                                  }}
                                >
                                  {slot.sessionLimit} حصة
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: "#e5e7eb", fontSize: 18 }}>
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <button
              onClick={saveWeeklyImage}
              style={{
                background: "var(--c-primary)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 8px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ⬇️ حفظ صورة 3K
            </button>
            <button
              onClick={copyWeeklyAsText}
              style={{
                background: "var(--c-primary-bg)",
                color: "var(--c-primary)",
                border: "1px solid var(--c-primary-border)",
                borderRadius: 12,
                padding: "12px 8px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              📋 نسخ للواتساب
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Monthly Sheet
// ════════════════════════════════════════════════════════════════════════════════
function MonthlySheetTab({ students, sessions, settings, showT }) {
  const now = new Date();
  const [subTab, setSubTab] = useState("sheet");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [overrides, setOverrides] = useState({});
  const [hidden, setHidden] = useState([]);
  const [archiveKey, setArchiveKey] = useState(null);
  const [archives, setArchives] = useState([]);
  const sheetRef = useRef(null);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    (async () => {
      const saved = (await dbGet("hq3-monthly-archives")) || [];
      setArchives(saved);
      const ov = (await dbGet(`hq3-monthly-ov-${monthKey}`)) || {};
      setOverrides(ov);
      const hd = (await dbGet(`hq3-monthly-hidden-${monthKey}`)) || [];
      setHidden(hd);
    })();
  }, [monthKey]);

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

  const visibleStudents = students.filter((s) => !hidden.includes(s.id));
  const getCount = (id) =>
    overrides[id] !== undefined ? overrides[id] : counts[id] || 0;

  async function setCountOverride(id, val) {
    const upd = { ...overrides, [id]: Math.max(0, parseInt(val) || 0) };
    setOverrides(upd);
    await dbSet(`hq3-monthly-ov-${monthKey}`, upd);
  }

  async function toggleHide(id) {
    const upd = hidden.includes(id)
      ? hidden.filter((x) => x !== id)
      : [...hidden, id];
    setHidden(upd);
    await dbSet(`hq3-monthly-hidden-${monthKey}`, upd);
  }

  async function archiveMonth() {
    const entry = {
      key: monthKey,
      year,
      month,
      label: getMonthLabel(year, month),
      data: visibleStudents.map((s) => ({
        id: s.id,
        name: s.name,
        count: getCount(s.id),
        limit: s.sessionLimit || settings.defaultLimit || 12,
      })),
      archivedAt: Date.now(),
    };
    const existing = archives.filter((a) => a.key !== monthKey);
    const upd = [entry, ...existing];
    setArchives(upd);
    await dbSet("hq3-monthly-archives", upd);
    showT("✅ تم أرشفة الشهر");
  }

  async function generateSheetImageOrPdf() {
    if (!sheetRef.current) return;
    const totalVisible = visibleStudents.length;
    showT("⏳ جاري التجهيز...");

    try {
      if (totalVisible > PAGE_SIZE_PDF) {
        await Promise.all([loadHtmlToImage(), loadJsPdf()]);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();

        const chunks = [];
        for (let i = 0; i < totalVisible; i += PAGE_SIZE_PDF) {
          chunks.push(visibleStudents.slice(i, i + PAGE_SIZE_PDF));
        }

        for (let ci = 0; ci < chunks.length; ci++) {
          const chunk = chunks[ci];
          const pageEl = buildSheetPageElement(
            chunk,
            year,
            month,
            settings,
            getCount,
            ci + 1,
            chunks.length
          );
          document.body.appendChild(pageEl);
          await document.fonts.ready;
          await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r))
          );

          const restore = freezeAnimations(pageEl);
          const dataUrl = await captureElement(pageEl, 2);
          restore();
          document.body.removeChild(pageEl);

          if (ci > 0) pdf.addPage();
          pdf.addImage(dataUrl, "PNG", 0, 0, pageW, pageH);
        }

        pdf.save(`شيت_${getMonthLabel(year, month)}.pdf`);
        showT(`✅ تم حفظ PDF (${chunks.length} صفحة)`);
      } else {
        const restore = freezeAnimations(sheetRef.current);
        const dataUrl = await captureElement(sheetRef.current, 3);
        restore();
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `شيت_${getMonthLabel(year, month)}.png`;
        a.click();
        showT("✅ تم حفظ الشيت بجودة عالية!");
      }
    } catch (e) {
      console.error("خطأ في توليد الشيت:", e);
      showT("❌ حدث خطأ في الحفظ: " + e.message, "warn");
    }
  }

  function copyAsText() {
    const lines = [
      `📋 شيت حضور حلقة القرآن الكريم`,
      `📅 ${getMonthLabel(year, month)}`,
      `المعلم: ${settings.teacherName || "محمد محمود"}`,
      `─────────────────────────`,
      ...visibleStudents.map((s, i) => {
        const c = getCount(s.id);
        const lim = s.sessionLimit || settings.defaultLimit || 12;
        return `${i + 1}. ${s.name}   ${c} / ${lim} حصة`;
      }),
      `─────────────────────────`,
      `الإجمالي: ${visibleStudents.reduce(
        (sum, s) => sum + getCount(s.id),
        0
      )} حصة`,
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => showT("✅ تم نسخ الشيت للواتساب"))
      .catch(() => showT("❌ خطأ في النسخ", "warn"));
  }

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

  const C = {
    background: "var(--color-background-primary)",
    borderRadius: 14,
    border: "0.5px solid var(--color-border-tertiary)",
    padding: "14px 15px",
    marginBottom: 10,
  };

  if (archiveKey) {
    const arch = archives.find((a) => a.key === archiveKey);
    return (
      <div style={{ animation: "fadeUp .3s ease" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <button
            onClick={() => setArchiveKey(null)}
            style={{
              background: "var(--color-background-secondary)",
              border: "none",
              padding: "6px 12px",
              borderRadius: 14,
              fontSize: 13,
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontWeight: 500,
            }}
          >
            🔙 رجوع
          </button>
          <span
            style={{ fontSize: 15, fontWeight: 700, color: "var(--c-primary)" }}
          >
            أرشيف: {arch?.label}
          </span>
        </div>
        {arch?.data.map((row, i) => (
          <div
            key={row.id}
            style={{
              ...C,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {i + 1}. {row.name}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color:
                  row.count >= row.limit
                    ? "var(--c-primary)"
                    : "var(--c-amber)",
              }}
            >
              {row.count} / {row.limit}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const totalSessions = visibleStudents.reduce(
    (s, st) => s + getCount(st.id),
    0
  );

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div
        style={{
          display: "flex",
          background: "var(--color-background-primary)",
          borderRadius: 12,
          border: "0.5px solid var(--color-border-tertiary)",
          padding: 4,
          marginBottom: 12,
          gap: 4,
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
              borderRadius: 9,
              padding: "9px 4px",
              fontSize: 12,
              fontFamily: "inherit",
              cursor: "pointer",
              fontWeight: subTab === k ? 700 : 500,
              background: subTab === k ? "var(--c-primary)" : "transparent",
              color: subTab === k ? "#fff" : "var(--color-text-tertiary)",
              transition: "all .2s",
            }}
          >
            {em} {lb}
          </button>
        ))}
      </div>

      {subTab === "sheet" && (
        <div style={{ animation: "fadeUp .25s ease" }}>
          <div
            style={{
              ...C,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={prevMonth}
              style={{
                background: "var(--color-background-secondary)",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--c-primary)",
                }}
              >
                {getMonthLabel(year, month)}
              </div>
              <div
                style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}
              >
                إجمالي الحصص: {totalSessions}
              </div>
              {visibleStudents.length > PAGE_SIZE_PDF && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--c-amber)",
                    marginTop: 2,
                  }}
                >
                  📄 {Math.ceil(visibleStudents.length / PAGE_SIZE_PDF)} صفحات
                  PDF عند الحفظ
                </div>
              )}
            </div>
            <button
              onClick={nextMonth}
              style={{
                background: "var(--color-background-secondary)",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>

          <div
            ref={sheetRef}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              marginBottom: 10,
              direction: "rtl",
              fontFamily: "'Tajawal', Tahoma, sans-serif",
            }}
          >
            <div
              style={{
                background: "#065f46",
                color: "#fff",
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                شيت حضور حلقة القرآن الكريم
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>
                {getMonthLabel(year, month)} · المعلم:{" "}
                {settings.teacherName || "محمد محمود"}
              </div>
            </div>

            {students.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#9ca3af",
                  padding: "30px 0",
                  fontSize: 13,
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
                    minWidth: 400,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f0fdf4" }}>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#065f46",
                          borderBottom: "2px solid #065f46",
                          width: 36,
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#065f46",
                          borderBottom: "2px solid #065f46",
                        }}
                      >
                        الطالب
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#065f46",
                          borderBottom: "2px solid #065f46",
                          minWidth: 90,
                        }}
                      >
                        الحضور
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#065f46",
                          borderBottom: "2px solid #065f46",
                          minWidth: 140,
                        }}
                      >
                        التقدم
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#065f46",
                          borderBottom: "2px solid #065f46",
                          width: 70,
                        }}
                      >
                        إجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const c = getCount(s.id);
                      const lim = s.sessionLimit || settings.defaultLimit || 12;
                      const pct = Math.round((c / lim) * 100);
                      const isHid = hidden.includes(s.id);
                      const barColor =
                        pct >= 100
                          ? "#065f46"
                          : pct >= 75
                          ? "#d97706"
                          : "#1d4ed8";
                      return (
                        <tr
                          key={s.id}
                          style={{
                            background: isHid
                              ? "#f9fafb"
                              : i % 2 === 0
                              ? "#fff"
                              : "#f9fafb",
                            opacity: isHid ? 0.5 : 1,
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 12,
                              color: "#9ca3af",
                              textAlign: "center",
                            }}
                          >
                            {i + 1}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {s.name}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              textAlign: "center",
                            }}
                          >
                            {!isHid && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 5,
                                }}
                              >
                                <button
                                  onClick={() => setCountOverride(s.id, c - 1)}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    border: "0.5px solid #e5e7eb",
                                    borderRadius: 6,
                                    background: "#fee2e2",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#dc2626",
                                    lineHeight: 1,
                                  }}
                                >
                                  −
                                </button>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: c >= lim ? "#065f46" : "#b45309",
                                    minWidth: 50,
                                    textAlign: "center",
                                  }}
                                >
                                  {c} / {lim}
                                </span>
                                <button
                                  onClick={() => setCountOverride(s.id, c + 1)}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    border: "0.5px solid #e5e7eb",
                                    borderRadius: 6,
                                    background: "#d1fae5",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#065f46",
                                    lineHeight: 1,
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {!isHid && (
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 10,
                                    color: "#9ca3af",
                                    marginBottom: 3,
                                  }}
                                >
                                  <span>{pct}%</span>
                                  <span>
                                    {c >= lim ? "✅ مكتمل" : `${lim - c} متبقي`}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    height: 8,
                                    background: "#f3f4f6",
                                    borderRadius: 4,
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: Math.min(100, pct) + "%",
                                      background: barColor,
                                      borderRadius: 4,
                                      transition: "width .4s",
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              textAlign: "center",
                            }}
                          >
                            <button
                              onClick={() => toggleHide(s.id)}
                              style={{
                                background: isHid ? "#d1fae5" : "#f3f4f6",
                                border: "none",
                                borderRadius: 6,
                                padding: "4px 8px",
                                fontSize: 10,
                                cursor: "pointer",
                                color: isHid ? "#065f46" : "#9ca3af",
                              }}
                            >
                              {isHid ? "إظهار" : "إخفاء"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {students.length > 0 && (
                      <tr
                        style={{
                          background: "#f0fdf4",
                          borderTop: "2px solid #065f46",
                        }}
                      >
                        <td
                          colSpan={2}
                          style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#065f46",
                          }}
                        >
                          الإجمالي الكلي
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            textAlign: "center",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#065f46",
                          }}
                        >
                          {totalSessions} حصة
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <button
              onClick={generateSheetImageOrPdf}
              style={{
                background: "var(--c-primary)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 8px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {visibleStudents.length > PAGE_SIZE_PDF
                ? "⬇️ حفظ PDF"
                : "⬇️ حفظ صورة 3K"}
            </button>
            <button
              onClick={copyAsText}
              style={{
                background: "var(--c-primary-bg)",
                color: "var(--c-primary)",
                border: "1px solid var(--c-primary-border)",
                borderRadius: 12,
                padding: "12px 8px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              📋 نسخ للواتساب
            </button>
          </div>
          <button
            onClick={archiveMonth}
            style={{
              width: "100%",
              background: "var(--c-amber-bg)",
              color: "var(--c-amber)",
              border: "1px solid var(--c-amber-border)",
              borderRadius: 12,
              padding: "11px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: 10,
            }}
          >
            🗄️ أرشفة هذا الشهر
          </button>

          {archives.length > 0 && (
            <div
              style={{
                background: "var(--color-background-primary)",
                borderRadius: 14,
                border: "0.5px solid var(--color-border-tertiary)",
                padding: "14px 15px",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: 10,
                }}
              >
                🗄️ الأرشيف ({archives.length} شهر)
              </div>
              {archives.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setArchiveKey(a.key)}
                  style={{
                    width: "100%",
                    textAlign: "right",
                    background: "var(--color-background-secondary)",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    color: "var(--color-text-primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "inherit",
                  }}
                >
                  <span>{a.label}</span>
                  <span style={{ color: "var(--c-primary)", fontWeight: 700 }}>
                    عرض ›
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === "schedule" && <WeeklyScheduleView students={students} />}
    </div>
  );
}

function buildSheetPageElement(
  chunkStudents,
  year,
  month,
  settings,
  getCount,
  pageNum,
  totalPages
) {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 1122px; background: #ffffff;
    font-family: 'Tajawal', Tahoma, sans-serif;
    direction: rtl; padding: 0;
  `;

  const monthLabel = getMonthLabel(year, month);
  const teacherName = settings.teacherName || "محمد محمود";
  const defaultLimit = settings.defaultLimit || 12;
  const totalSess = chunkStudents.reduce((s, st) => s + getCount(st.id), 0);

  el.innerHTML = `
    <div style="background:#065f46;color:#fff;padding:20px 24px;text-align:center;">
      <div style="font-size:20px;font-weight:700;">شيت حضور حلقة القرآن الكريم</div>
      <div style="font-size:13px;opacity:0.85;margin-top:4px;">${monthLabel} · المعلم: ${teacherName}${
    totalPages > 1 ? ` · صفحة ${pageNum} من ${totalPages}` : ""
  }</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f0fdf4;">
          <th style="padding:12px 14px;text-align:center;font-size:13px;font-weight:700;color:#065f46;border-bottom:2px solid #065f46;width:40px;">#</th>
          <th style="padding:12px 14px;text-align:right;font-size:13px;font-weight:700;color:#065f46;border-bottom:2px solid #065f46;">الطالب</th>
          <th style="padding:12px 14px;text-align:center;font-size:13px;font-weight:700;color:#065f46;border-bottom:2px solid #065f46;width:120px;">الحضور</th>
          <th style="padding:12px 14px;text-align:center;font-size:13px;font-weight:700;color:#065f46;border-bottom:2px solid #065f46;">التقدم</th>
        </tr>
      </thead>
      <tbody>
        ${chunkStudents
          .map((s, i) => {
            const c = getCount(s.id);
            const lim = s.sessionLimit || defaultLimit;
            const pct = Math.min(100, Math.round((c / lim) * 100));
            const barColor =
              pct >= 100 ? "#065f46" : pct >= 75 ? "#d97706" : "#1d4ed8";
            const rowBg = i % 2 === 0 ? "#fff" : "#f9fafb";
            return `
            <tr style="background:${rowBg};border-bottom:1px solid #f3f4f6;">
              <td style="padding:12px 14px;font-size:12px;color:#9ca3af;text-align:center;">${
                i + 1
              }</td>
              <td style="padding:12px 14px;font-size:15px;font-weight:600;color:#111827;">${
                s.name
              }</td>
              <td style="padding:12px 14px;text-align:center;font-size:14px;font-weight:700;color:${
                c >= lim ? "#065f46" : "#b45309"
              };">${c} / ${lim}</td>
              <td style="padding:12px 14px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="flex:1;height:10px;background:#f3f4f6;border-radius:5px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:${barColor};border-radius:5px;"></div>
                  </div>
                  <span style="font-size:11px;color:#9ca3af;min-width:35px;">${pct}%</span>
                </div>
              </td>
            </tr>
          `;
          })
          .join("")}
        <tr style="background:#f0fdf4;border-top:2px solid #065f46;">
          <td colspan="2" style="padding:12px 14px;font-size:14px;font-weight:700;color:#065f46;">الإجمالي الكلي</td>
          <td style="padding:12px 14px;text-align:center;font-size:15px;font-weight:700;color:#065f46;">${totalSess} حصة</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `;
  return el;
}

const CSS_VARS = `
  :root {
    --font-sans:  'Tajawal', Tahoma, Geneva, Verdana, sans-serif;
    --font-quran: 'Amiri', serif;
    --color-background-primary:   #ffffff;
    --color-background-secondary: #f9fafb;
    --color-background-tertiary:  #f3f4f6;
    --color-text-primary:         #111827;
    --color-text-secondary:       #4b5563;
    --color-text-tertiary:        #9ca3af;
    --color-border-secondary:     #e5e7eb;
    --color-border-tertiary:      #f3f4f6;
    --c-primary:        #065f46;
    --c-primary-dark:   #047857;
    --c-primary-light:  #d1fae5;
    --c-primary-mid:    #a7f3d0;
    --c-primary-border: #6ee7b7;
    --c-primary-bg:     #f0fdf4;
    --c-blue:           #1d4ed8;
    --c-blue-light:     #dbeafe;
    --c-amber:          #92400e;
    --c-amber-dark:     #b45309;
    --c-amber-mid:      #d97706;
    --c-amber-light:    #fef3c7;
    --c-amber-border:   #fcd34d;
    --c-amber-bg:       #fffbeb;
    --c-yellow:         #f59e0b;
    --c-yellow-border:  #fbbf24;
    --c-red:            #dc2626;
    --c-red-light:      #fee2e2;
    --c-green:          #10b981;
    --c-green-light:    #bbf7d0;
    --c-purple:         #7c3aed;
    --c-whatsapp:       #25D366;
    --c-pink:           #db2777;
    --c-pink-light:     #fce7f3;
    --c-invalid-border: #ef4444;
    --c-invalid-bg:     #fef2f2;
    --c-invalid-text:   #b91c1c;
  }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeRight { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes popIn     { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
  @keyframes pulseGlow { 0%{box-shadow:0 0 0 0 rgba(245,158,11,.4)} 70%{box-shadow:0 0 0 10px rgba(245,158,11,0)} 100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes celebrate { 0%{transform:scale(0.5);opacity:0} 50%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes coinShine { 0%{background-position:-200%} 100%{background-position:200%} }
  input:focus, textarea:focus, select:focus { outline:none !important; border-color:var(--c-primary-border) !important; box-shadow:0 0 0 3px rgba(110,231,183,.15) !important; }
  button:active { transform:scale(.97) !important; }
  * { box-sizing:border-box; }
`;

// ════════════════════════════════════════════════════════════════════════════════
// Main App Component
// ════════════════════════════════════════════════════════════════════════════════
function DashboardContent({ user, onLogout }) {
  const [tab, setTab] = useState("form");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State للقائمة الجانبية
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({
    accountingPhone: "",
    defaultLimit: 12,
    teacherName: "محمد محمود",
  });
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const defaultDate = new Date().toISOString().split("T")[0];

  const [sessionType, setSessionType] = useState("quran");

  const [editSessionId, setEditSessionId] = useState(null);
  const [pkgCountInput, setPkgCountInput] = useState("");
  const [pkgCountEditable, setPkgCountEditable] = useState(false);
  const [sessionDate, setSessionDate] = useState(defaultDate);

  const [hifzText, setHifzText] = useState("");
  const [hifzRating, setHifzRating] = useState(null);
  const [tajweed, setTajweed] = useState([]);
  const [hifzNotes, setHifzNotes] = useState("");
  const [recentText, setRecentText] = useState("");
  const [recentRating, setRecentRating] = useState(null);
  const [recentNotes, setRecentNotes] = useState("");
  const [distantText, setDistantText] = useState("");
  const [distantRating, setDistantRating] = useState(null);
  const [distantNotes, setDistantNotes] = useState("");
  const [att, setAtt] = useState(0);
  const [inter, setInter] = useState(0);
  const [ach, setAch] = useState(0);
  const [hwNew, setHwNew] = useState({ surah: "", from: "", to: "" });
  const [hwRecent, setHwRecent] = useState({ surah: "", from: "", to: "" });
  const [hwDistant, setHwDistant] = useState({ surah: "", from: "", to: "" });

  const [islamicGeneral, setIslamicGeneral] = useState("");
  const [islamicBlocks, setIslamicBlocks] = useState([]);
  const [islamicCustom, setIslamicCustom] = useState("");
  const [islamicRating, setIslamicRating] = useState(null);
  const [islamicNotes, setIslamicNotes] = useState("");
  const [islamicAtt, setIslamicAtt] = useState(0);
  const [islamicInter, setIslamicInter] = useState(0);
  const [islamicAch, setIslamicAch] = useState(0);
  const [islamicHw, setIslamicHw] = useState("");

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [lastSess, setLastSess] = useState(null);
  const [pkgCountState, setPkgCountState] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [triedToSave, setTriedToSave] = useState(false);

  const [previewSession, setPreviewSession] = useState(null);
  const reportRef = useRef(null);
  const fileInputRef = useRef(null);
  const pickerRef = useRef(null);
  const previewRef = useRef(null);
  const rewardModalRef = useRef(null);

  const [showStuForm, setShowStuForm] = useState(false);
  const [editStu, setEditStu] = useState(null);
  const [sfName, setSfName] = useState("");
  const [sfPhone, setSfPhone] = useState("");
  const [sfGroup, setSfGroup] = useState("");
  const [sfLimit, setSfLimit] = useState(12);
  const [sfGender, setSfGender] = useState("boy");
  const [sfSchedule, setSfSchedule] = useState([]);

  const [histStu, setHistStu] = useState(null);
  const [toast, setToast] = useState(null);
  const [acPhone, setAcPhone] = useState("");
  const [defLimit, setDefLimit] = useState(12);
  const [teacherNameInput, setTeacherNameInput] = useState("محمد محمود");

  const [analysisStudent, setAnalysisStudent] = useState("all");
  const [showReward, setShowReward] = useState(null);
  const [rewardAmount, setRewardAmount] = useState("");
  const certRef = useRef(null);

  const [pickerSearch, setPickerSearch] = useState("");
  const [analysisRange, setAnalysisRange] = useState("all");
  const [histPage, setHistPage] = useState(HIST_PAGE_SIZE);

  const toastTimerRef = useRef(null);
  const showT = useCallback((msg, type = "ok") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const precon1 = Object.assign(document.createElement("link"), {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    });
    const precon2 = Object.assign(document.createElement("link"), {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
    });
    precon2.crossOrigin = "anonymous";
    const fontLink = Object.assign(document.createElement("link"), {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&display=swap",
    });
    document.head.prepend(fontLink);
    document.head.prepend(precon2);
    document.head.prepend(precon1);
    const style = document.createElement("style");
    style.innerHTML = CSS_VARS;
    document.head.appendChild(style);
    return () => {
      [precon1, precon2, fontLink, style].forEach(
        (el) => el.parentNode && el.parentNode.removeChild(el)
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (_gifWorkerUrl) {
        URL.revokeObjectURL(_gifWorkerUrl);
        _gifWorkerUrl = null;
        _gifState = "idle";
      }
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (showPicker) {
        setShowPicker(false);
        return;
      }
      if (previewSession) {
        setPreviewSession(null);
        return;
      }
      if (showReward) {
        setShowReward(null);
        return;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showPicker, previewSession, showReward, isSidebarOpen]);

  useEffect(() => {
    if (showPicker && pickerRef.current) {
      const f = pickerRef.current.querySelector("input, button");
      f?.focus();
    }
  }, [showPicker]);
  useEffect(() => {
    if (previewSession && previewRef.current) {
      const f = previewRef.current.querySelector("button");
      f?.focus();
    }
  }, [previewSession]);
  useEffect(() => {
    if (showReward && rewardModalRef.current) {
      const f = rewardModalRef.current.querySelector("button");
      f?.focus();
    }
  }, [showReward]);

  useEffect(() => {
    (async () => {
      const s = await dbGet("hq3-students");
      const ss = await dbGet("hq3-sessions");
      const st = await dbGet("hq3-settings");
      if (s) setStudents(s);
      if (ss) setSessions(ss);
      if (st) {
        setSettings(st);
        setAcPhone(st.accountingPhone || "");
        setDefLimit(st.defaultLimit || 12);
        setTeacherNameInput(st.teacherName || "محمد محمود");
      }
      setReady(true);
    })();
  }, []);

  const sessionsByStudent = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.studentId]) map[s.studentId] = [];
      map[s.studentId].push(s);
    }
    for (const k of Object.keys(map))
      map[k].sort((a, b) => new Date(a.date) - new Date(b.date));
    return map;
  }, [sessions]);

  const stuAll = useCallback(
    (id) => sessionsByStudent[id] || [],
    [sessionsByStudent]
  );
  const getCurrentPkgCount = useCallback(
    (id) => {
      const all = stuAll(id);
      return all.length ? all[all.length - 1].packageSessionNum || 0 : 0;
    },
    [stuAll]
  );
  const getNextPkgCount = useCallback(
    (id, limit) => {
      const c = getCurrentPkgCount(id);
      return c >= limit ? 1 : c + 1;
    },
    [getCurrentPkgCount]
  );

  const hasUnsavedData = () => {
    if (done) return false;
    if (sessionType === "quran") {
      return (
        hifzText.trim() !== "" ||
        recentText.trim() !== "" ||
        distantText.trim() !== "" ||
        hifzRating !== null ||
        recentRating !== null ||
        distantRating !== null ||
        att > 0 ||
        inter > 0 ||
        ach > 0 ||
        tajweed.length > 0 ||
        hwNew.surah.trim() !== ""
      );
    }
    return (
      islamicGeneral.trim() !== "" ||
      islamicBlocks.length > 0 ||
      islamicRating !== null
    );
  };

  const handleTabChange = useCallback(
    (newTab) => {
      if (tab === "form" && newTab !== "form" && hasUnsavedData()) {
        if (
          !window.confirm(
            "⚠️ لديك بيانات غير محفوظة في الفورم.\nهل تريد الانتقال بدون حفظ؟ ستُفقد البيانات."
          )
        )
          return;
      }
      setTab(newTab);
      setHistStu(null);
      setShowStuForm(false);
      setHistPage(HIST_PAGE_SIZE);
    },
    [
      tab,
      done,
      sessionType,
      hifzText,
      recentText,
      distantText,
      hifzRating,
      recentRating,
      distantRating,
      att,
      inter,
      ach,
      tajweed,
      hwNew,
      islamicGeneral,
      islamicBlocks,
      islamicRating,
    ]
  );

  const openAdd = useCallback(() => {
    const initLimit = settings.defaultLimit || 12;
    setEditStu(null);
    setSfName("");
    setSfPhone("");
    setSfGroup("");
    setSfLimit(initLimit);
    setSfGender("boy");
    setSfSchedule(defaultSchedule(initLimit));
    setShowStuForm(true);
  }, [settings.defaultLimit]);

  const openEdit = useCallback((s) => {
    setEditStu(s);
    setSfName(s.name);
    setSfPhone(s.phone || "");
    setSfGroup(s.groupLink || "");
    setSfLimit(s.sessionLimit || 12);
    setSfGender(s.gender || "boy");
    setSfSchedule(
      s.schedule?.length ? s.schedule : defaultSchedule(s.sessionLimit || 12)
    );
    setShowStuForm(true);
  }, []);

  async function saveStu() {
    if (!sfName.trim()) return;
    const parsedLimit = parseInt(sfLimit) || 12;
    let upd;
    if (editStu) {
      upd = students.map((s) =>
        s.id === editStu.id
          ? {
              ...s,
              name: sfName.trim(),
              phone: sfPhone.trim(),
              groupLink: sfGroup.trim(),
              sessionLimit: parsedLimit,
              gender: sfGender,
              schedule: sfSchedule,
            }
          : s
      );
      if (student?.id === editStu.id)
        setStudent((p) => ({
          ...p,
          name: sfName.trim(),
          phone: sfPhone.trim(),
          groupLink: sfGroup.trim(),
          sessionLimit: parsedLimit,
          gender: sfGender,
          schedule: sfSchedule,
        }));
    } else {
      upd = [
        ...students,
        {
          id: Date.now(),
          name: sfName.trim(),
          phone: sfPhone.trim(),
          groupLink: sfGroup.trim(),
          sessionLimit: parsedLimit,
          gender: sfGender,
          schedule: sfSchedule,
        },
      ];
    }
    setStudents(upd);
    await dbSet("hq3-students", upd);
    setShowStuForm(false);
    showT(editStu ? "✅ تم تحديث الطالب" : "✅ تم إضافة الطالب");
  }

  async function delStu(id) {
    if (!window.confirm("هل تريد حذف الطالب وكل بياناته؟")) return;
    const upd = students.filter((s) => s.id !== id);
    const us = sessions.filter((s) => s.studentId !== id);
    setStudents(upd);
    setSessions(us);
    await dbSet("hq3-students", upd);
    await dbSet("hq3-sessions", us);
    if (student?.id === id) setStudent(null);
    showT("🗑️ تم الحذف");
  }

  async function delSession(id) {
    if (!window.confirm("هل تريد حذف هذه الجلسة نهائياً؟")) return;
    const upd = sessions.filter((s) => s.id !== id);
    setSessions(upd);
    await dbSet("hq3-sessions", upd);
    showT("🗑️ تم حذف الجلسة");
  }

  async function saveSettings() {
    const upd = {
      accountingPhone: acPhone.trim(),
      defaultLimit: parseInt(defLimit) || 12,
      teacherName: teacherNameInput.trim() || "محمد محمود",
    };
    setSettings(upd);
    await dbSet("hq3-settings", upd);
    showT("✅ تم حفظ الإعدادات");
  }

  function loadSession(s) {
    const stu = students.find((x) => x.id === s.studentId);
    setStudent(stu);
    setEditSessionId(s.id);
    setPkgCountInput(s.packageSessionNum || 1);
    setPkgCountEditable(true);
    setSessionDate(s.date || defaultDate);
    setSessionType(s.sessionType || "quran");

    if (s.sessionType === "islamic") {
      setIslamicGeneral(s.islamic?.general || "");
      setIslamicBlocks(s.islamic?.blocks || []);
      setIslamicRating(s.islamic?.rating || null);
      setIslamicNotes(s.islamic?.notes || "");
      setIslamicAtt(s.islamic?.scores?.att || 0);
      setIslamicInter(s.islamic?.scores?.inter || 0);
      setIslamicAch(s.islamic?.scores?.ach || 0);
      setIslamicHw(s.islamic?.hw || "");
      setIslamicCustom(s.islamic?.custom || "");
    } else {
      setHifzText(s.hifz?.text || "");
      setHifzRating(s.hifz?.rating || null);
      setTajweed(s.hifz?.tajweed || []);
      setHifzNotes(s.hifz?.notes || s.hifzNotes || "");
      setRecentText(s.recent?.text || s.review?.text || "");
      setRecentRating(s.recent?.rating || s.review?.rating || null);
      setRecentNotes(s.recent?.notes || s.reviewNotes || "");
      setDistantText(s.distant?.text || "");
      setDistantRating(s.distant?.rating || null);
      setDistantNotes(s.distant?.notes || "");
      setAtt(s.scores?.att || 0);
      setInter(s.scores?.inter || 0);
      setAch(s.scores?.ach || 0);
      setHwNew(s.hw?.new || { surah: "", from: "", to: "" });
      setHwRecent(s.hw?.recent || { surah: "", from: "", to: "" });
      setHwDistant(s.hw?.distant || { surah: "", from: "", to: "" });
    }
    setDone(false);
    setTriedToSave(false);
    setPreviewSession(null);
    setHistStu(null);
    setTab("form");
    window.scrollTo(0, 0);
  }

  async function saveSession() {
    if (!student || saving) return;
    setTriedToSave(true);

    if (sessionType === "quran" && !hifzText.trim()) {
      showT("⚠️ أدخل نص التسميع أولاً", "warn");
      return;
    }
    if (
      sessionType === "islamic" &&
      !islamicGeneral.trim() &&
      islamicBlocks.length === 0
    ) {
      showT("⚠️ أدخل ما تم في الحلقة أولاً", "warn");
      return;
    }

    setSaving(true);
    const limit = student.sessionLimit || settings.defaultLimit || 12;
    const finalPkgCount = Math.max(1, parseInt(pkgCountInput) || 1);
    const isLim = finalPkgCount >= limit;

    let sessObj;
    if (sessionType === "quran") {
      const hifzRObj = RATINGS.find((r) => r.v === hifzRating);
      const recentRObj = RATINGS.find((r) => r.v === recentRating);
      const distantRObj = RATINGS.find((r) => r.v === distantRating);
      const overall =
        att + inter + ach > 0
          ? Math.round(((att + inter + ach) / 3) * 10) / 10
          : 0;
      sessObj = {
        studentId: student.id,
        studentName: student.name,
        date: sessionDate,
        dateAr: getArDate(sessionDate),
        sessionType: "quran",
        hifz: {
          text: hifzText,
          rating: hifzRating,
          ratingLabel: hifzRObj?.label || "",
          tajweed: [...tajweed],
          notes: hifzNotes,
        },
        recent: {
          text: recentText,
          rating: recentRating,
          ratingLabel: recentRObj?.label || "",
          notes: recentNotes,
        },
        distant: {
          text: distantText,
          rating: distantRating,
          ratingLabel: distantRObj?.label || "",
          notes: distantNotes,
        },
        scores: { att, inter, ach },
        overall,
        hw: { new: hwNew, recent: hwRecent, distant: hwDistant },
      };
    } else {
      const overall =
        islamicAtt + islamicInter + islamicAch > 0
          ? Math.round(((islamicAtt + islamicInter + islamicAch) / 3) * 10) / 10
          : 0;
      sessObj = {
        studentId: student.id,
        studentName: student.name,
        date: sessionDate,
        dateAr: getArDate(sessionDate),
        sessionType: "islamic",
        islamic: {
          general: islamicGeneral,
          blocks: islamicBlocks,
          custom: islamicCustom,
          rating: islamicRating,
          notes: islamicNotes,
          hw: islamicHw,
          scores: { att: islamicAtt, inter: islamicInter, ach: islamicAch },
        },
        overall,
      };
    }

    let updSessions = [...sessions],
      finalSess;
    if (editSessionId) {
      const existing = sessions.find((s) => s.id === editSessionId);
      const pkgNum = Math.ceil(existing.sessionNum / limit) || 1;
      finalSess = {
        ...existing,
        ...sessObj,
        packageSessionNum: finalPkgCount,
        isPackageEnd: isLim,
        packageNum: pkgNum,
      };
      updSessions = sessions.map((s) =>
        s.id === editSessionId ? finalSess : s
      );
    } else {
      const sessionTotalNum = stuAll(student.id).length + 1;
      const pkgNum = Math.ceil(sessionTotalNum / limit) || 1;
      finalSess = {
        ...sessObj,
        id: Date.now(),
        sessionNum: sessionTotalNum,
        packageSessionNum: finalPkgCount,
        isPackageEnd: isLim,
        packageNum: pkgNum,
      };
      updSessions.push(finalSess);
    }
    setSessions(updSessions);
    await dbSet("hq3-sessions", updSessions);
    setPkgCountState(finalPkgCount);
    setLimitReached(isLim);
    setLastSess(finalSess);
    setPreviewSession(finalSess);
    setDone(true);
    setSaving(false);
    setEditSessionId(null);
    setTriedToSave(false);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ students, sessions, settings })], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `QuranTracker_Backup_${defaultDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showT("✅ تم تحميل النسخة الاحتياطية!");
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.students) await dbSet("hq3-students", data.students);
        if (data.sessions) await dbSet("hq3-sessions", data.sessions);
        if (data.settings) await dbSet("hq3-settings", data.settings);
        showT("✅ تم استعادة البيانات! سيتم تحديث الصفحة...");
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        showT("❌ خطأ: ملف النسخة غير صالح", "warn");
      }
    };
    reader.readAsText(file);
  }

  async function generateImageAndDownload() {
    if (!reportRef.current) return;
    showT("⏳ جاري حفظ الصورة...");
    try {
      const restore = freezeAnimations(reportRef.current);
      const dataUrl = await captureElement(reportRef.current, 2);
      restore();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `تقرير_${previewSession?.studentName}_${previewSession?.date}.png`;
      a.click();
      showT("✅ تم حفظ الصورة!");
    } catch (e) {
      console.error("خطأ في حفظ الصورة:", e);
      showT("❌ حدث خطأ في الحفظ: " + e.message, "warn");
    }
  }

  async function shareImage() {
    if (!reportRef.current) return;
    showT("⏳ جاري تجهيز الصورة...");
    try {
      await loadHtmlToImage();
      const restore = freezeAnimations(reportRef.current);
      await document.fonts.ready;
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
      const blob = await window.htmlToImage.toBlob(reportRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
        useCORS: true,
      });
      restore();
      if (!blob) return showT("❌ حدث خطأ", "warn");
      const file = new File([blob], `تقرير_${previewSession.studentName}.png`, {
        type: "image/png",
      });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: "تقرير الجلسة", files: [file] });
        } else throw new Error();
      } catch {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          showT("✅ تم نسخ الصورة! الصقها في الواتساب");
        } catch {
          showT("⚠️ متصفحك يمنع النسخ. احفظ الصورة أولاً.", "warn");
        }
      }
    } catch (e) {
      console.error("خطأ في مشاركة الصورة:", e);
      showT("❌ حدث خطأ", "warn");
    }
  }

  async function downloadCertificate() {
    if (!certRef.current) return;
    showT("⏳ جاري تجهيز الشهادة بجودة 4K...");
    try {
      const restore = freezeAnimations(certRef.current);
      const dataUrl = await captureElement(certRef.current, 4);
      restore();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `شهادة_${showReward.name}.png`;
      a.click();
      showT("✅ تم حفظ الشهادة بجودة 4K!");
    } catch (e) {
      console.error("خطأ في حفظ الشهادة:", e);
      showT("❌ حدث خطأ: " + e.message, "warn");
    }
  }

  async function shareAsGif() {
    if (!certRef.current) return;
    showT("⏳ جاري إنشاء GIF...");
    try {
      const [workerUrl] = await Promise.all([loadGifJs(), loadHtmlToImage()]);
      const el = certRef.current;
      const SCALE = 1.5,
        W = Math.round(el.scrollWidth * SCALE),
        H = Math.round(el.scrollHeight * SCALE);
      const gif = new window.GIF({
        workers: 2,
        quality: 8,
        width: W,
        height: H,
        workerScript: workerUrl,
        background: "#ffffff",
        transparent: null,
        repeat: 0,
      });
      const FRAME_COUNT = 16,
        FRAME_DELAY = 110;
      for (let i = 0; i < FRAME_COUNT; i++) {
        await new Promise((r) => setTimeout(r, FRAME_DELAY));
        const dataUrl = await captureElement(el, SCALE);
        gif.addFrame(await dataUrlToCanvas(dataUrl, W, H), {
          delay: FRAME_DELAY,
          copy: true,
        });
      }
      gif.on("finished", (blob) => {
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = `شهادة_${showReward.name}.gif`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 6000);
        showT("✅ تم تصدير GIF!");
      });
      gif.on("error", (e) => {
        console.error(e);
        showT("❌ فشل إنشاء GIF", "warn");
      });
      gif.render();
    } catch (e) {
      console.error(e);
      showT("❌ حدث خطأ", "warn");
    }
  }

  async function copyAccountingMsg(s) {
    const stu = students.find((x) => x.id === s.studentId);
    const limit = stu?.sessionLimit || settings.defaultLimit || 12;
    const msg = `🔔 *إشعار انتهاء باقة الحصص*\n\nالطالب: *${s.studentName}*\nتم إتمام الحلقة رقم: *${s.packageSessionNum}* في باقة الـ *${limit}* حصص\nبتاريخ: ${s.dateAr}\n\nيرجى التواصل مع ولي الأمر لتجديد الاشتراك.`;
    try {
      await navigator.clipboard.writeText(msg);
      showT("✅ تم نسخ التنبيه");
    } catch {
      showT("❌ خطأ في النسخ", "warn");
    }
  }

  function reset() {
    setStudent(null);
    setPkgCountInput("");
    setPkgCountEditable(false);
    setSessionDate(defaultDate);
    setHifzText("");
    setHifzRating(null);
    setTajweed([]);
    setHifzNotes("");
    setRecentText("");
    setRecentRating(null);
    setRecentNotes("");
    setDistantText("");
    setDistantRating(null);
    setDistantNotes("");
    setAtt(0);
    setInter(0);
    setAch(0);
    setHwNew({ surah: "", from: "", to: "" });
    setHwRecent({ surah: "", from: "", to: "" });
    setHwDistant({ surah: "", from: "", to: "" });
    setIslamicGeneral("");
    setIslamicBlocks([]);
    setIslamicCustom("");
    setIslamicRating(null);
    setIslamicNotes("");
    setIslamicAtt(0);
    setIslamicInter(0);
    setIslamicAch(0);
    setIslamicHw("");
    setDone(false);
    setLastSess(null);
    setPkgCountState(0);
    setLimitReached(false);
    setEditSessionId(null);
    setPreviewSession(null);
    setTriedToSave(false);
    setSessionType("quran");
  }

  function resetKeepStudent() {
    const keepStu = student;
    reset();
    if (keepStu) {
      const limit = keepStu.sessionLimit || settings.defaultLimit || 12;
      setStudent(keepStu);
      setPkgCountInput(getNextPkgCount(keepStu.id, limit));
      setPkgCountEditable(false);
    }
  }

  const TEACHER = settings.teacherName || "محمد محمود";
  const C = {
    background: "var(--color-background-primary)",
    borderRadius: 14,
    border: "0.5px solid var(--color-border-tertiary)",
    padding: "14px 15px",
    marginBottom: 10,
  };
  const I = {
    width: "100%",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    fontFamily: "inherit",
    direction: "rtl",
    outline: "none",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    boxSizing: "border-box",
    marginBottom: 8,
  };
  const I_ERR = {
    ...I,
    border: "1.5px solid var(--c-invalid-border)",
    background: "var(--c-invalid-bg)",
  };
  const chip = (on, c, bg) => ({
    display: "inline-block",
    padding: "5px 11px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: on ? 500 : 400,
    cursor: "pointer",
    margin: "3px 3px 3px 0",
    transition: "all .15s",
    background: on ? bg : "var(--color-background-secondary)",
    color: on ? c : "var(--color-text-secondary)",
    border: `0.5px solid ${on ? c : "var(--color-border-secondary)"}`,
    transform: on ? "scale(1.05)" : "scale(1)",
  });
  const SH = (em, txt) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 10,
      }}
    >
      <span style={{ fontSize: 18 }}>{em}</span>
      <span
        style={{ fontSize: 14, fontWeight: 500, color: "var(--c-primary)" }}
      >
        {txt}
      </span>
    </div>
  );
  const Btn = (label, bg, fg, onClick, disabled) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "12px",
        fontSize: 14,
        fontWeight: 500,
        background: disabled ? "var(--color-background-secondary)" : bg,
        color: disabled ? "var(--color-text-tertiary)" : fg,
        border: "none",
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: "all .2s",
        marginBottom: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
  const renderRatingBtns = (currentVal, setter) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
      {RATINGS.map((r) => (
        <button
          key={r.v}
          onClick={() => setter(currentVal === r.v ? null : r.v)}
          style={{
            border: `0.5px solid ${
              currentVal === r.v ? r.color : "var(--color-border-secondary)"
            }`,
            borderRadius: 20,
            padding: "6px 11px",
            fontSize: 12,
            fontWeight: currentVal === r.v ? 500 : 400,
            background:
              currentVal === r.v ? r.bg : "var(--color-background-secondary)",
            color: currentVal === r.v ? r.color : "var(--color-text-secondary)",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all .15s",
            transform: currentVal === r.v ? "scale(1.04)" : "scale(1)",
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  if (!ready)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          fontSize: 18,
          color: "var(--color-text-secondary)",
          direction: "rtl",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📿</div>جاري التحميل...
      </div>
    );

  function renderIslamicPreview(sess) {
    const isl = sess.islamic;
    return (
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f3f4f6",
            padding: "12px 14px",
            borderRadius: 10,
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            👤 {sess.studentName}
          </div>
          <div style={{ fontSize: 12, color: "#4b5563" }}>{sess.dateAr}</div>
        </div>
        <div
          style={{
            background: "#fef3c7",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 14,
            border: "1px solid #fcd34d",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#92400e",
              marginBottom: 4,
            }}
          >
            📘 تربية إسلامية
          </div>
          <div style={{ fontSize: 13, color: "#4b5563" }}>
            {isl?.general || "—"}
          </div>
        </div>
        {isl?.blocks?.length > 0 &&
          isl.blocks.map((b, i) => {
            const cat = ISLAMIC_CATEGORIES.find((c) => c.id === b.catId);
            const label = cat ? `${cat.icon} ${cat.label}` : b.catId;
            return (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  borderRight: "4px solid #f59e0b",
                  paddingRight: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#92400e",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                {Object.entries(b.data || {}).map(([k, v]) =>
                  v ? (
                    <div
                      key={k}
                      style={{
                        fontSize: 12,
                        color: "#4b5563",
                        marginBottom: 2,
                      }}
                    >
                      <strong>
                        {cat?.fields.find((f) => f.key === k)?.label || k}:
                      </strong>{" "}
                      {v}
                    </div>
                  ) : null
                )}
              </div>
            );
          })}
        {isl?.custom && (
          <div
            style={{
              background: "#f0fdf4",
              borderRadius: 10,
              padding: "10px",
              border: "1px dashed #6ee7b7",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#065f46",
                marginBottom: 4,
              }}
            >
              ➕ إضافات أخرى
            </div>
            <div style={{ fontSize: 12, color: "#4b5563" }}>{isl.custom}</div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            background: "#f9fafb",
            padding: "12px 8px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            marginBottom: 20,
          }}
        >
          {[
            ["حضور", isl?.scores?.att],
            ["تفاعل", isl?.scores?.inter],
            ["إنجاز", isl?.scores?.ach],
          ].map(([lb, v]) => (
            <div key={lb} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#4b5563",
                  marginBottom: 4,
                }}
              >
                {lb}
              </div>
              <div style={{ fontSize: 12, letterSpacing: 2 }}>
                {"⭐".repeat(v || 0)}
              </div>
            </div>
          ))}
        </div>
        {isl?.hw && (
          <div
            style={{
              background: "#f0fdf4",
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #bbf7d0",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#065f46",
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              📚 واجب الحصة القادمة
            </div>
            <div style={{ fontSize: 13, color: "#4b5563" }}>{isl.hw}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        direction: "rtl",
        background: "var(--color-background-tertiary)",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background:
              toast.type === "warn"
                ? "var(--c-amber-light)"
                : "var(--c-primary-light)",
            color:
              toast.type === "warn" ? "var(--c-amber)" : "var(--c-primary)",
            padding: "8px 18px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,.1)",
            animation: "fadeUp .25s ease",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── HEADER ── */}
      <div 
        style={{ 
          background: "var(--c-primary, #065f46)", 
          height: "70px",
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          position: "sticky", 
          top: 0, 
          zIndex: 100,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}
      >
        {/* زرار القائمة (متثبت على اليمين) */}
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          style={{ 
            position: "absolute",
            right: "15px",
            background: "none", 
            border: "none", 
            color: "#fff", 
            fontSize: 28, 
            cursor: "pointer",
            padding: "5px"
          }}
        >
          ☰
        </button>

        {/* اللوجو والاسم (متسنتر في النص) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img 
            src="/logo.png" 
            alt="شعار البرنامج" 
            style={{ 
              height: 45, 
              width: "auto", 
              objectFit: "contain", 
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" 
            }} 
            /* لو الصورة مش موجودة هيخفي الأيقونة المكسورة */
            onError={(e) => e.target.style.display='none'} 
          />
          <div style={{ color: "#fff", fontWeight: "800", fontSize: 22, fontFamily: "var(--font-quran, 'Tajawal', sans-serif)" }}>
            رفيق المعلم
          </div>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.6)", 
            zIndex: 9999, 
            backdropFilter: "blur(3px)" 
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              position: "absolute", 
              right: 0, 
              top: 0, 
              bottom: 0, 
              width: 280, 
              background: "#fff", 
              display: "flex", 
              flexDirection: "column",
              boxShadow: "-5px 0 15px rgba(0,0,0,0.3)"
            }}
          >
            {/* رأس القائمة */}
            <div style={{ background: "#065f46", padding: "30px 20px", color: "#fff", borderBottomLeftRadius: 15 }}>
              <div style={{ fontSize: 22, fontWeight: "800" }}>القائمة الرئيسية</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 5 }}>👤 أهلاً بك، {TEACHER}</div>
            </div>

            {/* روابط التنقل */}
            <div style={{ padding: 15, flex: 1, overflowY: "auto" }}>
              {[
                ["form", "🏠", "الرئيسية (تسجيل)"],
                ["history", "📋", "سجلات الطلاب"],
                ["analysis", "📊", "تحليل الأداء"],
                ["monthly", "🗓️", "الجدول والشيت"],
                ["settings", "⚙️", "الإعدادات العامة"],
              ].map(([k, em, lb]) => (
                <button 
                  key={k} 
                  onClick={() => { setTab(k); setIsSidebarOpen(false); }} 
                  style={{ 
                    width: "100%", 
                    textAlign: "right", 
                    padding: 15, 
                    marginBottom: 8, 
                    borderRadius: 12, 
                    border: "none", 
                    background: tab === k ? "#f0fdf4" : "transparent", 
                    color: tab === k ? "#065f46" : "#4b5563", 
                    display: "flex", 
                    gap: 12, 
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: tab === k ? 700 : 500,
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ fontSize: 20 }}>{em}</span> {lb}
                </button>
              ))}
            </div>

            {/* زرار الخروج تحت خالص */}
            <div style={{ padding: 20, borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
               <button 
                  onClick={onLogout} 
                  style={{ 
                    width: "100%", 
                    padding: 15, 
                    borderRadius: 12, 
                    border: "none", 
                    background: "#fee2e2", 
                    color: "#dc2626", 
                    fontWeight: "bold", 
                    fontSize: 15, 
                    cursor: "pointer", 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    gap: 8,
                    transition: "all 0.2s"
                  }}
               >
                  🚪 تسجيل خروج
               </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "11px 12px 60px" }}>
        {/* ══ FORM TAB ══ */}
        {tab === "form" && !done && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            {editSessionId && (
              <div
                style={{
                  background: "var(--c-amber-light)",
                  color: "var(--c-amber)",
                  padding: "8px 12px",
                  borderRadius: 10,
                  marginBottom: 10,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ✏️ وضع التعديل: أنت تقوم بتعديل جلسة مسجلة مسبقاً
              </div>
            )}

            <div style={{ ...C, padding: "10px 12px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setSessionType("quran")}
                  style={{
                    flex: 1,
                    padding: "10px 6px",
                    borderRadius: 10,
                    border: `1.5px solid ${
                      sessionType === "quran"
                        ? "var(--c-primary)"
                        : "var(--color-border-secondary)"
                    }`,
                    background:
                      sessionType === "quran"
                        ? "var(--c-primary-bg)"
                        : "var(--color-background-secondary)",
                    color:
                      sessionType === "quran"
                        ? "var(--c-primary)"
                        : "var(--color-text-tertiary)",
                    fontSize: 13,
                    fontWeight: sessionType === "quran" ? 700 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                >
                  📿 تسجيل قرآن
                </button>
                <button
                  onClick={() => setSessionType("islamic")}
                  style={{
                    flex: 1,
                    padding: "10px 6px",
                    borderRadius: 10,
                    border: `1.5px solid ${
                      sessionType === "islamic"
                        ? "var(--c-amber-mid)"
                        : "var(--color-border-secondary)"
                    }`,
                    background:
                      sessionType === "islamic"
                        ? "var(--c-amber-bg)"
                        : "var(--color-background-secondary)",
                    color:
                      sessionType === "islamic"
                        ? "var(--c-amber)"
                        : "var(--color-text-tertiary)",
                    fontSize: 13,
                    fontWeight: sessionType === "islamic" ? 700 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                >
                  📘 تربية إسلامية
                </button>
              </div>
            </div>

            <div style={C}>
              {SH("👤", "بيانات الجلسة")}
              <button
                onClick={() => {
                  setPickerSearch("");
                  setShowPicker(true);
                }}
                style={{
                  width: "100%",
                  textAlign: "right",
                  background: student
                    ? "var(--c-primary-bg)"
                    : "var(--color-background-secondary)",
                  border: `0.5px solid ${
                    student
                      ? "var(--c-primary-border)"
                      : "var(--color-border-secondary)"
                  }`,
                  borderRadius: 10,
                  padding: "11px 13px",
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: student
                    ? "var(--c-primary)"
                    : "var(--color-text-tertiary)",
                  fontWeight: student ? 700 : 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span>
                  {student ? "✅ " + student.name : "اضغط لاختيار الطالب..."}
                </span>
                <span style={{ fontSize: 16 }}>👤</span>
              </button>

              {student &&
                (() => {
                  const limit =
                    student.sessionLimit || settings.defaultLimit || 12;
                  const parsed = parseInt(pkgCountInput);
                  const pct =
                    pkgCountInput !== "" && !isNaN(parsed)
                      ? Math.round((parsed / limit) * 100)
                      : 0;
                  const c =
                    pct >= 100
                      ? "var(--c-red)"
                      : pct >= 80
                      ? "var(--c-amber-mid)"
                      : "var(--c-primary)";
                  return (
                    <div
                      style={{
                        background: "var(--color-background-secondary)",
                        borderRadius: 10,
                        padding: "9px 12px",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 12,
                          color: "var(--color-text-secondary)",
                          marginBottom: 6,
                        }}
                      >
                        <span>
                          🔢 الحلقة الحالية في الباقة{" "}
                          {editSessionId && "(تعديل)"}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              background: "#fff",
                              border: `1.5px solid ${c}`,
                              borderRadius: 8,
                              padding: "3px 10px",
                              fontWeight: 700,
                              fontSize: 13,
                              color: c,
                              minWidth: 70,
                              textAlign: "center",
                            }}
                          >
                            {pkgCountInput || "—"} / {limit}
                          </div>
                          {pkgCountEditable ? (
                            <>
                              <input
                                type="number"
                                min="1"
                                max={limit}
                                autoFocus
                                style={{
                                  width: 44,
                                  padding: "3px 4px",
                                  textAlign: "center",
                                  borderRadius: 6,
                                  border: `1px solid ${c}`,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: c,
                                  outline: "none",
                                }}
                                value={pkgCountInput}
                                onChange={(e) =>
                                  setPkgCountInput(e.target.value)
                                }
                              />
                              <button
                                onClick={() => setPkgCountEditable(false)}
                                style={{
                                  background: "var(--c-primary-light)",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "3px 8px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--c-primary)",
                                  cursor: "pointer",
                                }}
                              >
                                ✓ تم
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setPkgCountEditable(true)}
                              style={{
                                background: "var(--color-background-tertiary)",
                                border: "none",
                                borderRadius: 6,
                                padding: "3px 8px",
                                fontSize: 11,
                                fontWeight: 500,
                                color: "var(--color-text-secondary)",
                                cursor: "pointer",
                              }}
                            >
                              ✏️ تعديل
                            </button>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: "var(--color-border-tertiary)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: Math.min(100, pct) + "%",
                            background: c,
                            borderRadius: 3,
                            transition: "width .5s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

              <div
                style={{
                  background: "var(--c-primary-bg)",
                  borderRadius: 9,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "0.5px solid var(--c-primary-border)",
                }}
              >
                <span style={{ fontSize: 16 }}>📅</span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--c-primary)",
                    fontWeight: 700,
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: 13,
                    flex: 1,
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>

            {!student ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 20px",
                  background: "var(--color-background-primary)",
                  borderRadius: 16,
                  border: "2px dashed var(--color-border-secondary)",
                  animation: "fadeUp .3s ease",
                }}
              >
                <div style={{ fontSize: 56, marginBottom: 14 }}>📿</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: 6,
                  }}
                >
                  اختر طالبًا أولاً
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-tertiary)",
                    marginBottom: 18,
                    lineHeight: 1.6,
                  }}
                >
                  اضغط على زرار "اضغط لاختيار الطالب" في الأعلى
                  <br />
                  لبدء تسجيل جلسة جديدة
                </div>
                <button
                  onClick={() => {
                    setPickerSearch("");
                    setShowPicker(true);
                  }}
                  style={{
                    background: "var(--c-primary)",
                    color: "#fff",
                    border: "none",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  👤 اختر طالبًا
                </button>
              </div>
            ) : sessionType === "quran" ? (
              <>
                <div style={C}>
                  {SH("✨", "التسميع")}
                  <input
                    style={triedToSave && !hifzText.trim() ? I_ERR : I}
                    value={hifzText}
                    onChange={(e) => setHifzText(e.target.value)}
                    placeholder="السور / الآيات التي تم تسميعها..."
                  />
                  {triedToSave && !hifzText.trim() && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--c-invalid-text)",
                        marginTop: -6,
                        marginBottom: 6,
                      }}
                    >
                      ⚠️ هذا الحقل مطلوب
                    </div>
                  )}
                  {renderRatingBtns(hifzRating, setHifzRating)}
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-tertiary)",
                      marginBottom: 4,
                    }}
                  >
                    ⚠️ أخطاء التجويد:
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    {TAJWEED.map((e) => (
                      <span
                        key={e}
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={tajweed.includes(e)}
                        onKeyDown={(ev) =>
                          (ev.key === "Enter" || ev.key === " ") &&
                          setTajweed((p) =>
                            p.includes(e) ? p.filter((x) => x !== e) : [...p, e]
                          )
                        }
                        onClick={() =>
                          setTajweed((p) =>
                            p.includes(e) ? p.filter((x) => x !== e) : [...p, e]
                          )
                        }
                        style={chip(
                          tajweed.includes(e),
                          "var(--c-amber)",
                          "var(--c-amber-light)"
                        )}
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                  <textarea
                    style={{
                      ...I,
                      height: 50,
                      resize: "none",
                      marginBottom: 0,
                    }}
                    value={hifzNotes}
                    onChange={(e) => setHifzNotes(e.target.value)}
                    placeholder="ملاحظات التسميع..."
                  />
                </div>
                <div style={C}>
                  {SH("🔄", "الماضي القريب")}
                  <input
                    style={I}
                    value={recentText}
                    onChange={(e) => setRecentText(e.target.value)}
                    placeholder="السورة / الآيات..."
                  />
                  {renderRatingBtns(recentRating, setRecentRating)}
                  <textarea
                    style={{
                      ...I,
                      height: 45,
                      resize: "none",
                      marginBottom: 0,
                    }}
                    value={recentNotes}
                    onChange={(e) => setRecentNotes(e.target.value)}
                    placeholder="ملاحظات الماضي القريب..."
                  />
                </div>
                <div style={C}>
                  {SH("🕰️", "الماضي البعيد")}
                  <input
                    style={I}
                    value={distantText}
                    onChange={(e) => setDistantText(e.target.value)}
                    placeholder="السورة / الآيات..."
                  />
                  {renderRatingBtns(distantRating, setDistantRating)}
                  <textarea
                    style={{
                      ...I,
                      height: 45,
                      resize: "none",
                      marginBottom: 0,
                    }}
                    value={distantNotes}
                    onChange={(e) => setDistantNotes(e.target.value)}
                    placeholder="ملاحظات الماضي البعيد..."
                  />
                </div>
                <div style={C}>
                  {SH("📊", "التقييم العام")}
                  {[
                    ["الحضور والانتباه 👁️", att, setAtt],
                    ["التفاعل والمشاركة 💬", inter, setInter],
                    ["الإنجاز الكلي 🏆", ach, setAch],
                  ].map(([lb, v, set]) => (
                    <div key={lb} style={{ marginBottom: 11 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--color-text-secondary)",
                          marginBottom: 4,
                          fontWeight: 500,
                        }}
                      >
                        {lb}
                      </div>
                      <Stars value={v} onChange={set} />
                    </div>
                  ))}
                </div>
                <div style={C}>
                  {SH("📚", "واجب الحلقة القادمة")}
                  {[
                    ["✨ التسميع الجديد:", "var(--c-primary)", hwNew, setHwNew],
                    [
                      "🔄 الماضي القريب:",
                      "var(--c-blue)",
                      hwRecent,
                      setHwRecent,
                    ],
                    [
                      "🕰️ الماضي البعيد:",
                      "var(--c-amber)",
                      hwDistant,
                      setHwDistant,
                    ],
                  ].map(([label, color, hw, setHw], i) => (
                    <div key={label}>
                      {i > 0 && (
                        <div
                          style={{
                            height: 1,
                            background: "var(--color-border-tertiary)",
                            margin: "10px 0",
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color,
                          marginBottom: 6,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 1fr 1fr",
                          gap: 6,
                        }}
                      >
                        <input
                          style={{ ...I, marginBottom: 0 }}
                          value={hw.surah}
                          onChange={(e) =>
                            setHw({ ...hw, surah: e.target.value })
                          }
                          placeholder="السورة"
                        />
                        <input
                          style={{ ...I, marginBottom: 0 }}
                          value={hw.from}
                          onChange={(e) =>
                            setHw({ ...hw, from: e.target.value })
                          }
                          placeholder="من آية"
                        />
                        <input
                          style={{ ...I, marginBottom: 0 }}
                          value={hw.to}
                          onChange={(e) => setHw({ ...hw, to: e.target.value })}
                          placeholder="إلى آية"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {Btn(
                  saving
                    ? "⏳ جاري الحفظ..."
                    : editSessionId
                    ? "💾 تحديث الجلسة"
                    : "💾 حفظ وتسجيل الجلسة",
                  "var(--c-primary)",
                  "#fff",
                  saveSession,
                  saving
                )}
                {editSessionId &&
                  Btn(
                    "إلغاء التعديل",
                    "var(--color-background-secondary)",
                    "var(--color-text-primary)",
                    reset,
                    false
                  )}
              </>
            ) : (
              <>
                <div style={C}>
                  {SH("📘", "تربية إسلامية")}
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-tertiary)",
                      marginBottom: 4,
                    }}
                  >
                    ما تم في الحلقة (عام):
                  </div>
                  <textarea
                    style={{
                      ...I,
                      height: 65,
                      resize: "none",
                      border:
                        triedToSave &&
                        !islamicGeneral.trim() &&
                        islamicBlocks.length === 0
                          ? "1.5px solid var(--c-invalid-border)"
                          : "0.5px solid var(--color-border-secondary)",
                    }}
                    value={islamicGeneral}
                    onChange={(e) => setIslamicGeneral(e.target.value)}
                    placeholder="وصف عام لما تم في الحصة..."
                  />
                  {triedToSave &&
                    !islamicGeneral.trim() &&
                    islamicBlocks.length === 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--c-invalid-text)",
                          marginTop: -4,
                          marginBottom: 6,
                        }}
                      >
                        ⚠️ أدخل وصفاً للحصة أو أضف تصنيفاً
                      </div>
                    )}
                </div>

                <div style={C}>
                  {SH("🗂️", "تصنيفات الحصة")}
                  {islamicBlocks.map((block, idx) => (
                    <IslamicCategoryBlock
                      key={idx}
                      catId={block.catId}
                      data={block.data}
                      onChange={(newData) => {
                        const upd = [...islamicBlocks];
                        upd[idx] = { ...upd[idx], data: newData };
                        setIslamicBlocks(upd);
                      }}
                      onRemove={() =>
                        setIslamicBlocks((b) => b.filter((_, i) => i !== idx))
                      }
                    />
                  ))}
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-tertiary)",
                        marginBottom: 6,
                      }}
                    >
                      إضافة تصنيف:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {ISLAMIC_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() =>
                            setIslamicBlocks((b) => [
                              ...b,
                              { catId: cat.id, data: {} },
                            ])
                          }
                          style={{
                            background: "var(--c-amber-bg)",
                            color: "var(--c-amber)",
                            border: "1px dashed var(--c-amber-border)",
                            borderRadius: 20,
                            padding: "5px 11px",
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: "var(--color-border-tertiary)",
                      margin: "10px 0",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-tertiary)",
                      marginBottom: 4,
                    }}
                  >
                    ➕ إضافة حرة (تصنيف مخصص):
                  </div>
                  <textarea
                    style={{
                      ...I,
                      height: 50,
                      resize: "none",
                      marginBottom: 0,
                    }}
                    value={islamicCustom}
                    onChange={(e) => setIslamicCustom(e.target.value)}
                    placeholder="أضف أي محتوى آخر غير مذكور..."
                  />
                </div>

                <div style={C}>
                  {SH("📊", "التقييم")}
                  {renderRatingBtns(islamicRating, setIslamicRating)}
                  {[
                    ["الحضور والانتباه 👁️", islamicAtt, setIslamicAtt],
                    ["التفاعل والمشاركة 💬", islamicInter, setIslamicInter],
                    ["الإنجاز الكلي 🏆", islamicAch, setIslamicAch],
                  ].map(([lb, v, set]) => (
                    <div key={lb} style={{ marginBottom: 11 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--color-text-secondary)",
                          marginBottom: 4,
                          fontWeight: 500,
                        }}
                      >
                        {lb}
                      </div>
                      <Stars value={v} onChange={set} />
                    </div>
                  ))}
                  <textarea
                    style={{
                      ...I,
                      height: 45,
                      resize: "none",
                      marginBottom: 0,
                    }}
                    value={islamicNotes}
                    onChange={(e) => setIslamicNotes(e.target.value)}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>

                <div style={C}>
                  {SH("📚", "واجب الحصة القادمة")}
                  <textarea
                    style={{
                      ...I,
                      height: 60,
                      resize: "none",
                      marginBottom: 0,
                    }}
                    value={islamicHw}
                    onChange={(e) => setIslamicHw(e.target.value)}
                    placeholder="الواجب المنزلي للحصة القادمة..."
                  />
                </div>

                {Btn(
                  saving
                    ? "⏳ جاري الحفظ..."
                    : editSessionId
                    ? "💾 تحديث الجلسة"
                    : "💾 حفظ وتسجيل الجلسة",
                  "var(--c-amber-mid)",
                  "#fff",
                  saveSession,
                  saving
                )}
                {editSessionId &&
                  Btn(
                    "إلغاء التعديل",
                    "var(--color-background-secondary)",
                    "var(--color-text-primary)",
                    reset,
                    false
                  )}
              </>
            )}
          </div>
        )}

        {/* DONE SCREEN */}
        {tab === "form" && done && lastSess && (
          <div
            style={{
              textAlign: "center",
              animation: "popIn .4s ease",
              padding: "12px 0",
            }}
          >
            {limitReached && (
              <div
                style={{
                  background: "var(--c-amber-light)",
                  border: "0.5px solid var(--c-yellow-border)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 14,
                  animation: "shake .5s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--c-amber)",
                    marginBottom: 3,
                  }}
                >
                  ⚠️ اكتملت الباقة!
                </div>
                <div style={{ fontSize: 13, color: "var(--c-amber)" }}>
                  {student?.name} أنهى ({pkgCountState} حصة).
                </div>
              </div>
            )}
            <div
              style={{
                fontSize: 52,
                marginBottom: 8,
                display: "inline-block",
                animation: "bounce 1.2s infinite",
              }}
            >
              🎉
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--c-primary)",
                marginBottom: 3,
              }}
            >
              {editSessionId ? "تم تعديل الجلسة بنجاح!" : "تم التسجيل بنجاح!"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-tertiary)",
                marginBottom: 8,
              }}
            >
              {lastSess.studentName} — {lastSess.dateAr}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color:
                  lastSess.sessionType === "islamic"
                    ? "var(--c-amber)"
                    : "var(--c-primary)",
                background:
                  lastSess.sessionType === "islamic"
                    ? "var(--c-amber-light)"
                    : "var(--c-primary-light)",
                display: "inline-block",
                padding: "5px 14px",
                borderRadius: 20,
                marginBottom: 8,
              }}
            >
              {lastSess.sessionType === "islamic"
                ? "📘 تربية إسلامية"
                : "📿 قرآن كريم"}
            </div>
            <br />
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--c-primary)",
                background: "var(--c-primary-light)",
                display: "inline-block",
                padding: "6px 16px",
                borderRadius: 20,
                marginBottom: 16,
              }}
            >
              🔢 رقم الحصة في الباقة: {pkgCountState}
            </div>
            {Btn(
              "🖼️ معاينة وإرسال التقرير",
              "var(--c-blue)",
              "#fff",
              () => setPreviewSession(lastSess),
              false
            )}
            {Btn(
              "🔁 جلسة أخرى لنفس الطالب",
              "var(--c-primary-bg)",
              "var(--c-primary)",
              resetKeepStudent,
              false
            )}
            {Btn(
              "➕ جلسة جديدة (طالب آخر)",
              "var(--color-background-secondary)",
              "var(--color-text-primary)",
              reset,
              false
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {tab === "history" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            {!histStu ? (
              <>
                {SH("📋", "سجلات الطلاب")}
                {students.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--color-text-tertiary)",
                      padding: "40px 0",
                    }}
                  >
                    لا يوجد طلاب — أضفهم من الإعدادات 📚
                  </div>
                )}
                {students.map((s) => {
                  const ss = stuAll(s.id);
                  const limit = s.sessionLimit || settings.defaultLimit || 12;
                  const curr = getCurrentPkgCount(s.id);
                  const pct = Math.round((curr / limit) * 100);
                  const last = ss[ss.length - 1];
                  return (
                    <div
                      key={s.id}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        (setHistStu(s), setHistPage(HIST_PAGE_SIZE))
                      }
                      style={{ ...C, cursor: "pointer" }}
                      onClick={() => {
                        setHistStu(s);
                        setHistPage(HIST_PAGE_SIZE);
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "var(--c-primary)",
                          }}
                        >
                          {s.name}{" "}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 400,
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {s.gender === "girl" ? "(بنت)" : "(ولد)"}
                          </span>
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            background: "var(--color-background-secondary)",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontWeight: 500,
                          }}
                        >
                          إجمالي: {ss.length}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        <span>
                          الباقة الحالية:{" "}
                          <span
                            style={{
                              fontWeight: 700,
                              color:
                                pct >= 90
                                  ? "var(--c-red)"
                                  : pct >= 75
                                  ? "var(--c-amber-mid)"
                                  : "inherit",
                            }}
                          >
                            {curr} / {limit}
                          </span>
                        </span>
                        {last && (
                          <span>
                            آخر حصة:{" "}
                            {last.dateAr.split("،")[1]?.trim() || last.dateAr}
                          </span>
                        )}
                      </div>
                      {s.schedule?.length > 0 && (
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 5,
                          }}
                        >
                          {s.schedule.map((sl) => (
                            <span
                              key={sl.id}
                              style={{
                                fontSize: 11,
                                background: "var(--c-primary-bg)",
                                color: "var(--c-primary)",
                                border: "0.5px solid var(--c-primary-border)",
                                borderRadius: 20,
                                padding: "2px 8px",
                              }}
                            >
                              {sl.day} {formatTime12h(sl.time)}
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        style={{
                          height: 4,
                          background: "var(--color-border-tertiary)",
                          borderRadius: 2,
                          marginTop: 8,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: Math.min(100, pct) + "%",
                            background:
                              pct >= 100 ? "var(--c-red)" : "var(--c-primary)",
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ animation: "fadeRight .2s ease" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--c-primary)",
                    }}
                  >
                    سجل {histStu.name}
                  </div>
                  <button
                    onClick={() => {
                      setHistStu(null);
                      setHistPage(HIST_PAGE_SIZE);
                    }}
                    style={{
                      background: "var(--color-background-secondary)",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 14,
                      fontSize: 13,
                      cursor: "pointer",
                      color: "var(--color-text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    🔙 رجوع
                  </button>
                </div>
                {stuAll(histStu.id).length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--color-text-tertiary)",
                      padding: "30px 0",
                    }}
                  >
                    لا توجد جلسات بعد
                  </div>
                )}
                {(() => {
                  const allForStu = [...stuAll(histStu.id)].reverse();
                  const displayed = allForStu.slice(0, histPage);
                  const hasMore = histPage < allForStu.length;
                  return (
                    <>
                      {displayed.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            ...C,
                            borderRight: `4px solid ${
                              s.sessionType === "islamic"
                                ? "var(--c-amber-mid)"
                                : "var(--c-primary)"
                            }`,
                            padding: "14px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 10,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#fff",
                                  background:
                                    s.sessionType === "islamic"
                                      ? "var(--c-amber-mid)"
                                      : "var(--c-primary)",
                                  padding: "3px 10px",
                                  borderRadius: 12,
                                  fontWeight: 700,
                                }}
                              >
                                حصة {s.packageSessionNum} (إجمالي {s.sessionNum}
                                )
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  background:
                                    s.sessionType === "islamic"
                                      ? "var(--c-amber-light)"
                                      : "var(--c-primary-light)",
                                  color:
                                    s.sessionType === "islamic"
                                      ? "var(--c-amber)"
                                      : "var(--c-primary)",
                                  padding: "2px 7px",
                                  borderRadius: 10,
                                }}
                              >
                                {s.sessionType === "islamic"
                                  ? "📘 تربية"
                                  : "📿 قرآن"}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--color-text-secondary)",
                                fontWeight: 500,
                              }}
                            >
                              {s.dateAr}
                            </span>
                          </div>
                          {s.sessionType === "islamic" ? (
                            <div
                              style={{
                                fontSize: 13,
                                marginBottom: 6,
                                lineHeight: 1.5,
                              }}
                            >
                              📘{" "}
                              <strong style={{ color: "var(--c-amber)" }}>
                                تربية:
                              </strong>{" "}
                              {s.islamic?.general || "—"}
                            </div>
                          ) : (
                            <>
                              {s.hifz?.text && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    marginBottom: 6,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  ✨{" "}
                                  <strong style={{ color: "var(--c-primary)" }}>
                                    تسميع:
                                  </strong>{" "}
                                  {s.hifz.text}
                                </div>
                              )}
                              {(s.recent?.text || s.review?.text) && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    marginBottom: 6,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  🔄{" "}
                                  <strong style={{ color: "var(--c-blue)" }}>
                                    قريب:
                                  </strong>{" "}
                                  {s.recent?.text || s.review?.text}
                                </div>
                              )}
                              {s.distant?.text && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    marginBottom: 6,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  🕰️{" "}
                                  <strong style={{ color: "var(--c-amber)" }}>
                                    بعيد:
                                  </strong>{" "}
                                  {s.distant.text}
                                </div>
                              )}
                            </>
                          )}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: 14,
                              paddingTop: 12,
                              borderTop:
                                "1px solid var(--color-border-tertiary)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--color-text-tertiary)",
                                fontWeight: 500,
                              }}
                            >
                              التقييم: {s.overall} / 5
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => loadSession(s)}
                                style={{
                                  background:
                                    "var(--color-background-tertiary)",
                                  color: "var(--color-text-primary)",
                                  border: "none",
                                  padding: "5px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                ✏️ تعديل
                              </button>
                              <button
                                onClick={() => setPreviewSession(s)}
                                style={{
                                  background: "var(--c-blue-light)",
                                  color: "var(--c-blue)",
                                  border: "none",
                                  padding: "5px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                🖼️ التقرير
                              </button>
                              <button
                                onClick={() => delSession(s.id)}
                                style={{
                                  background: "var(--c-red-light)",
                                  color: "var(--c-red)",
                                  border: "none",
                                  padding: "5px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          {s.isPackageEnd && (
                            <div
                              style={{
                                background: "var(--c-amber-bg)",
                                border: "1px dashed var(--c-yellow)",
                                padding: "10px",
                                borderRadius: 10,
                                marginTop: 12,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "var(--c-amber-dark)",
                                  fontWeight: 700,
                                }}
                              >
                                ⚠️ اكتملت الباقة
                              </span>
                              <button
                                onClick={() => copyAccountingMsg(s)}
                                style={{
                                  background: "var(--c-amber-mid)",
                                  color: "#fff",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                📋 نسخ إشعار الحسابات
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {hasMore && (
                        <button
                          onClick={() => setHistPage((p) => p + HIST_PAGE_SIZE)}
                          style={{
                            width: "100%",
                            background: "var(--color-background-secondary)",
                            color: "var(--c-primary)",
                            border: "1px dashed var(--c-primary-border)",
                            padding: "12px",
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            marginTop: 4,
                            fontFamily: "inherit",
                          }}
                        >
                          ⬇️ تحميل المزيد ({allForStu.length - histPage} جلسة
                          متبقية)
                        </button>
                      )}
                      {!hasMore && allForStu.length > 0 && (
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: 12,
                            color: "var(--color-text-tertiary)",
                            padding: "10px 0",
                          }}
                        >
                          عرض جميع الجلسات ({allForStu.length})
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ══ ANALYSIS TAB ══ */}
        {tab === "analysis" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            {sessions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--color-text-tertiary)",
                  padding: "40px 0",
                }}
              >
                لا توجد بيانات كافية للتحليل 📊
              </div>
            ) : (
              <>
                <div style={C}>
                  {SH("🎯", "تخصيص التحليل")}
                  <select
                    value={analysisStudent}
                    onChange={(e) => setAnalysisStudent(e.target.value)}
                    style={{
                      ...I,
                      marginBottom: 10,
                      fontWeight: 700,
                      color: "var(--c-primary)",
                      background: "var(--c-primary-bg)",
                      border: "1px solid var(--c-primary-border)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">
                      📊 إجمالي الأكاديمية (جميع الطلاب)
                    </option>
                    {students.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        👤 الطالب: {s.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      [
                        "week",
                        "📅 أسبوع",
                        "var(--c-blue-light)",
                        "var(--c-blue)",
                      ],
                      [
                        "month",
                        "📆 شهر",
                        "var(--c-primary-light)",
                        "var(--c-primary)",
                      ],
                      [
                        "all",
                        "📊 الكل",
                        "var(--color-background-tertiary)",
                        "var(--color-text-primary)",
                      ],
                    ].map(([v, lb, bg, fg]) => (
                      <button
                        key={v}
                        onClick={() => setAnalysisRange(v)}
                        style={{
                          flex: 1,
                          padding: "7px 4px",
                          borderRadius: 10,
                          border: `1.5px solid ${
                            analysisRange === v
                              ? fg
                              : "var(--color-border-secondary)"
                          }`,
                          background:
                            analysisRange === v
                              ? bg
                              : "var(--color-background-secondary)",
                          color:
                            analysisRange === v
                              ? fg
                              : "var(--color-text-secondary)",
                          fontSize: 12,
                          fontWeight: analysisRange === v ? 700 : 400,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all .15s",
                        }}
                      >
                        {lb}
                      </button>
                    ))}
                  </div>
                </div>
                {(() => {
                  const selectedId =
                    analysisStudent === "all"
                      ? null
                      : parseInt(analysisStudent, 10);
                  const baseSessions =
                    selectedId === null ? sessions : stuAll(selectedId);
                  if (baseSessions.length === 0)
                    return (
                      <div
                        style={{
                          textAlign: "center",
                          color: "var(--color-text-tertiary)",
                          padding: "20px 0",
                        }}
                      >
                        لا توجد حصص مسجلة لهذا الطالب بعد.
                      </div>
                    );
                  const now = Date.now();
                  const targetSessions =
                    analysisRange === "week"
                      ? baseSessions.filter(
                          (s) =>
                            new Date(s.date).getTime() >= now - 7 * 86400000
                        )
                      : analysisRange === "month"
                      ? baseSessions.filter(
                          (s) =>
                            new Date(s.date).getTime() >= now - 30 * 86400000
                        )
                      : baseSessions;
                  if (targetSessions.length === 0)
                    return (
                      <div
                        style={{
                          textAlign: "center",
                          color: "var(--color-text-tertiary)",
                          padding: "20px 0",
                        }}
                      >
                        لا توجد حصص في هذه الفترة الزمنية.
                      </div>
                    );
                  let wAvg = 0,
                    mAvg = 0,
                    stuObj = null;
                  if (selectedId !== null) {
                    stuObj = students.find((s) => s.id === selectedId);
                    const calcAvg = (arr) =>
                      arr.length
                        ? arr.reduce((sum, s) => sum + s.overall, 0) /
                          arr.length
                        : 0;
                    wAvg = calcAvg(
                      baseSessions.filter(
                        (s) => new Date(s.date).getTime() >= now - 7 * 86400000
                      )
                    );
                    mAvg = calcAvg(
                      baseSessions.filter(
                        (s) => new Date(s.date).getTime() >= now - 30 * 86400000
                      )
                    );
                  }
                  const chartData = targetSessions
                    .slice(-20)
                    .map((s, i) => ({ name: i + 1, overall: s.overall }));
                  return (
                    <>
                      {selectedId !== null && (wAvg >= 4 || mAvg >= 4.5) && (
                        <div
                          style={{
                            background:
                              mAvg >= 4.5
                                ? "linear-gradient(135deg,var(--c-amber-bg),var(--c-amber-light))"
                                : "linear-gradient(135deg,var(--c-primary-bg),var(--c-primary-light))",
                            padding: "16px",
                            borderRadius: 14,
                            textAlign: "center",
                            border:
                              mAvg >= 4.5
                                ? "1px solid var(--c-yellow-border)"
                                : "1px solid var(--c-green)",
                            marginBottom: 10,
                            animation: "pulseGlow 2s infinite",
                          }}
                        >
                          <div style={{ fontSize: 22, marginBottom: 8 }}>
                            🎉 أَدَاءٌ اِسْتِثْنَائِيٌّ و تَفَوُّقٌ! 🎉
                          </div>
                          <div style={{ marginBottom: 12, textAlign: "right" }}>
                            <label
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: "var(--color-text-secondary)",
                                marginBottom: 4,
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
                                ...I,
                                marginBottom: 0,
                                direction: "ltr",
                                textAlign: "center",
                                fontWeight: 700,
                              }}
                            />
                          </div>
                          {mAvg >= 4.5 ? (
                            <button
                              onClick={() =>
                                setShowReward({
                                  type: "month",
                                  name: stuObj.name,
                                  amount: rewardAmount,
                                  studentGender: stuObj.gender,
                                })
                              }
                              style={{
                                width: "100%",
                                background: "var(--c-yellow)",
                                color: "#fff",
                                border: "none",
                                padding: "10px",
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              🏆 إصدار شهادة تَفَوُّقِ الشَّهْرِ
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setShowReward({
                                  type: "week",
                                  name: stuObj.name,
                                  amount: rewardAmount,
                                  studentGender: stuObj.gender,
                                })
                              }
                              style={{
                                width: "100%",
                                background: "var(--c-green)",
                                color: "#fff",
                                border: "none",
                                padding: "10px",
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              🎁 إصدار شهادة تَفَوُّقِ الْأُسْبُوعِ
                            </button>
                          )}
                        </div>
                      )}
                      <div style={C}>
                        {SH(
                          "📈",
                          selectedId === null
                            ? `معدل الإنجاز (${
                                analysisRange === "week"
                                  ? "آخر أسبوع"
                                  : analysisRange === "month"
                                  ? "آخر شهر"
                                  : "كل البيانات"
                              })`
                            : `المستوى التحصيلي لـ ${stuObj?.name}`
                        )}
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                            marginBottom: 8,
                          }}
                        >
                          {targetSessions.length} حلقة في الفترة المحددة
                        </div>
                        <div style={{ height: 200, direction: "ltr" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="var(--color-border-tertiary)"
                              />
                              <XAxis
                                dataKey="name"
                                tick={{
                                  fontSize: 10,
                                  fill: "var(--color-text-tertiary)",
                                }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                domain={[0, 5]}
                                tick={{
                                  fontSize: 10,
                                  fill: "var(--color-text-tertiary)",
                                }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  background: "var(--color-background-primary)",
                                  border: "none",
                                  borderRadius: 8,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  fontSize: 12,
                                  direction: "rtl",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="overall"
                                stroke={
                                  selectedId === null
                                    ? "var(--c-primary)"
                                    : "var(--c-blue)"
                                }
                                strokeWidth={3}
                                dot={{
                                  r: 4,
                                  fill:
                                    selectedId === null ? "#065f46" : "#1d4ed8",
                                }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        {selectedId === null ? (
                          <>
                            <div
                              style={{
                                ...C,
                                textAlign: "center",
                                marginBottom: 0,
                              }}
                            >
                              <div style={{ fontSize: 24, marginBottom: 4 }}>
                                👥
                              </div>
                              <div
                                style={{
                                  fontSize: 18,
                                  fontWeight: 700,
                                  color: "var(--c-primary)",
                                }}
                              >
                                {students.length}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                إجمالي الطلاب
                              </div>
                            </div>
                            <div
                              style={{
                                ...C,
                                textAlign: "center",
                                marginBottom: 0,
                              }}
                            >
                              <div style={{ fontSize: 24, marginBottom: 4 }}>
                                📚
                              </div>
                              <div
                                style={{
                                  fontSize: 18,
                                  fontWeight: 700,
                                  color: "var(--c-primary)",
                                }}
                              >
                                {targetSessions.length}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                حصص في الفترة
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                ...C,
                                textAlign: "center",
                                marginBottom: 0,
                                borderTop: "3px solid var(--c-green)",
                              }}
                            >
                              <div style={{ fontSize: 20, marginBottom: 4 }}>
                                📅 أسبوعي
                              </div>
                              <div
                                style={{
                                  fontSize: 18,
                                  fontWeight: 700,
                                  color: "var(--c-primary)",
                                }}
                              >
                                {wAvg.toFixed(1)} / 5
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                متوسط آخر 7 أيام
                              </div>
                            </div>
                            <div
                              style={{
                                ...C,
                                textAlign: "center",
                                marginBottom: 0,
                                borderTop: "3px solid var(--c-yellow)",
                              }}
                            >
                              <div style={{ fontSize: 20, marginBottom: 4 }}>
                                📆 شهري
                              </div>
                              <div
                                style={{
                                  fontSize: 18,
                                  fontWeight: 700,
                                  color: "var(--c-primary)",
                                }}
                              >
                                {mAvg.toFixed(1)} / 5
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                متوسط آخر 30 يوم
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ══ MONTHLY / SCHEDULE TAB ══ */}
        {tab === "monthly" && (
          <MonthlySheetTab
            students={students}
            sessions={sessions}
            settings={settings}
            showT={showT}
          />
        )}

        {/* ══ SETTINGS TAB ══ */}
        {tab === "settings" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            {!showStuForm ? (
              <>
                <div style={C}>
                  {SH("⚙️", "الإعدادات العامة")}
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    اسم المعلم (يظهر في الهيدر والتقارير):
                  </div>
                  <input
                    style={I}
                    value={teacherNameInput}
                    onChange={(e) => setTeacherNameInput(e.target.value)}
                    placeholder="اسم المعلم"
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    رقم الحسابات (لإشعارات الباقات):
                  </div>
                  <input
                    style={{ ...I, direction: "ltr" }}
                    type="tel"
                    value={acPhone}
                    onChange={(e) => setAcPhone(e.target.value)}
                    placeholder="مثال: 2010xxxxxxxx"
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    الحد الافتراضي للباقة (عدد الحصص):
                  </div>
                  <input
                    style={I}
                    type="number"
                    value={defLimit}
                    onChange={(e) => setDefLimit(e.target.value)}
                  />
                  {Btn(
                    "💾 حفظ الإعدادات",
                    "var(--c-primary)",
                    "#fff",
                    saveSettings,
                    false
                  )}
                  <div
                    style={{
                      height: 1,
                      background: "var(--color-border-tertiary)",
                      margin: "15px 0",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--c-amber)",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    🛡️ الأمان والنسخ الاحتياطي (هام جداً):
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={exportBackup}
                      style={{
                        flex: 1,
                        background: "var(--c-amber-light)",
                        color: "var(--c-amber)",
                        border: "1px solid var(--c-amber-border)",
                        padding: "10px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ⬇️ حفظ نسخة احتياطية
                    </button>
                    <label
                      style={{
                        flex: 1,
                        background: "var(--color-border-secondary)",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        padding: "10px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      ⬆️ استعادة نسخة
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        style={{ display: "none" }}
                        ref={fileInputRef}
                      />
                    </label>
                  </div>
                </div>

                <div style={C}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    {SH("👥", "إدارة الطلاب")}
                    <button
                      onClick={openAdd}
                      style={{
                        background: "var(--c-primary-light)",
                        color: "var(--c-primary)",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ➕ إضافة طالب
                    </button>
                  </div>
                  {students.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "var(--color-text-tertiary)",
                        padding: "16px 0",
                        fontSize: 13,
                      }}
                    >
                      لا يوجد طلاب بعد
                    </div>
                  )}
                  {students.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom:
                          "0.5px solid var(--color-border-tertiary)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          {s.name}{" "}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 400,
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {s.gender === "girl" ? "♀️" : "♂️"}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                            marginTop: 2,
                          }}
                        >
                          سعة الباقة:{" "}
                          {s.sessionLimit || settings.defaultLimit || 12} حلقة
                        </div>
                        {s.schedule?.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                              marginTop: 5,
                            }}
                          >
                            {s.schedule.map((sl) => (
                              <span
                                key={sl.id}
                                style={{
                                  fontSize: 10,
                                  background: "var(--c-primary-bg)",
                                  color: "var(--c-primary)",
                                  border: "0.5px solid var(--c-primary-border)",
                                  borderRadius: 20,
                                  padding: "2px 7px",
                                }}
                              >
                                {sl.day} {formatTime12h(sl.time)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexShrink: 0,
                          marginRight: 8,
                        }}
                      >
                        <button
                          onClick={() => openEdit(s)}
                          style={{
                            background: "var(--color-background-tertiary)",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => delStu(s.id)}
                          style={{
                            background: "var(--c-red-light)",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={C}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  {SH(
                    editStu ? "✏️" : "➕",
                    editStu ? "تعديل بيانات الطالب" : "إضافة طالب جديد"
                  )}
                  <button
                    onClick={() => setShowStuForm(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 22,
                      cursor: "pointer",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    ×
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                    marginBottom: 4,
                  }}
                >
                  الاسم الكامل:
                </div>
                <input
                  style={I}
                  value={sfName}
                  onChange={(e) => setSfName(e.target.value)}
                  placeholder="اسم الطالب (مطلوب)"
                />
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                    marginBottom: 4,
                  }}
                >
                  النوع (ولد/بنت):
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <button
                    onClick={() => setSfGender("boy")}
                    style={chip(
                      sfGender === "boy",
                      "var(--c-blue)",
                      "var(--c-blue-light)"
                    )}
                  >
                    ♂️ ولد
                  </button>
                  <button
                    onClick={() => setSfGender("girl")}
                    style={chip(
                      sfGender === "girl",
                      "var(--c-pink)",
                      "var(--c-pink-light)"
                    )}
                  >
                    ♀️ بنت
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                    marginBottom: 4,
                  }}
                >
                  رقم واتساب ولي الأمر (بكود الدولة بدون +):
                </div>
                <input
                  style={{ ...I, direction: "ltr" }}
                  type="tel"
                  value={sfPhone}
                  onChange={(e) => setSfPhone(e.target.value)}
                  placeholder="مثال: 201012345678"
                />
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                    marginBottom: 4,
                  }}
                >
                  رابط جروب المتابعة:
                </div>
                <input
                  style={{ ...I, direction: "ltr" }}
                  type="url"
                  value={sfGroup}
                  onChange={(e) => setSfGroup(e.target.value)}
                  placeholder="رابط جروب الواتساب..."
                />
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                    marginBottom: 4,
                  }}
                >
                  عدد حصص الباقة لهذا الطالب:
                </div>
                <input
                  style={I}
                  type="number"
                  min={1}
                  value={sfLimit}
                  onChange={(e) => {
                    const newLimit = e.target.value;
                    setSfLimit(newLimit);
                    const oldSuggested = suggestedSlots(sfLimit);
                    if (
                      sfSchedule.length === 0 ||
                      sfSchedule.length === oldSuggested
                    ) {
                      setSfSchedule(defaultSchedule(newLimit));
                    }
                  }}
                />
                <div
                  style={{
                    height: 1,
                    background: "var(--color-border-tertiary)",
                    margin: "6px 0 12px",
                  }}
                />
                <ScheduleEditor
                  schedule={sfSchedule}
                  onChange={setSfSchedule}
                  sessionLimit={sfLimit}
                />
                <div
                  style={{
                    height: 1,
                    background: "var(--color-border-tertiary)",
                    margin: "12px 0 10px",
                  }}
                />
                {Btn(
                  "💾 حفظ بيانات الطالب",
                  "var(--c-primary)",
                  "#fff",
                  saveStu,
                  !sfName.trim()
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ PREVIEW MODAL ══ */}
      {previewSession &&
        (() => {
          const stu = students.find((x) => x.id === previewSession.studentId);
          const limit = stu?.sessionLimit || settings.defaultLimit || 12;
          const isIslamic = previewSession.sessionType === "islamic";
          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="معاينة التقرير"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                zIndex: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 15,
              }}
            >
              <div
                ref={previewRef}
                style={{
                  width: "100%",
                  maxWidth: 400,
                  background: "#fff",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  animation: "popIn .3s ease",
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "min(95dvh, 95vh)",
                }}
              >
                <div style={{ overflowY: "auto", flex: 1 }}>
                  <div
                    ref={reportRef}
                    style={{
                      padding: 0,
                      background: "#ffffff",
                      fontFamily: "var(--font-sans)",
                      direction: "rtl",
                    }}
                  >
                    <div
                      style={{
                        background: isIslamic
                          ? "var(--c-amber-mid)"
                          : "var(--c-primary)",
                        color: "#fff",
                        padding: "20px 15px",
                        textAlign: "center",
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 26,
                          fontFamily: "var(--font-quran)",
                          fontWeight: 700,
                        }}
                      >
                        {isIslamic
                          ? "تقرير حصة التربية الإسلامية"
                          : "تقرير حلقة القرآن الكريم"}
                      </h2>
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 14,
                          opacity: 0.9,
                        }}
                      >
                        المعلم: {TEACHER}
                      </p>
                    </div>
                    {isIslamic ? (
                      renderIslamicPreview(previewSession)
                    ) : (
                      <div style={{ padding: "20px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#f3f4f6",
                            padding: "12px 14px",
                            borderRadius: 10,
                            marginBottom: 18,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            👤 {previewSession.studentName}
                          </div>
                          <div style={{ fontSize: 12, color: "#4b5563" }}>
                            {previewSession.dateAr}
                          </div>
                        </div>
                        {[
                          [
                            "✨ التسميع",
                            "#065f46",
                            previewSession.hifz?.text,
                            previewSession.hifz?.ratingLabel,
                            null,
                            previewSession.hifz?.notes,
                            previewSession.hifz?.tajweed,
                          ],
                          [
                            "🔄 الماضي القريب",
                            "#1d4ed8",
                            previewSession.recent?.text ||
                              previewSession.review?.text,
                            previewSession.recent?.ratingLabel ||
                              previewSession.review?.ratingLabel,
                            null,
                            previewSession.recent?.notes ||
                              previewSession.reviewNotes,
                            null,
                          ],
                          [
                            "🕰️ الماضي البعيد",
                            "#92400e",
                            previewSession.distant?.text,
                            previewSession.distant?.ratingLabel,
                            null,
                            previewSession.distant?.notes,
                            null,
                          ],
                        ].map(
                          ([
                            title,
                            color,
                            text,
                            rating,
                            _,
                            notes,
                            tajweedList,
                          ]) => (
                            <div key={title} style={{ marginBottom: 16 }}>
                              <h3
                                style={{
                                  fontSize: 15,
                                  color: "#111827",
                                  margin: "0 0 8px",
                                  borderRight: `4px solid ${color}`,
                                  paddingRight: 8,
                                }}
                              >
                                {title}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  color: "#4b5563",
                                  lineHeight: 1.6,
                                }}
                              >
                                {text || "—"}
                              </p>
                              {rating && (
                                <p
                                  style={{
                                    margin: "4px 0 0",
                                    fontSize: 12,
                                    color: color,
                                    fontWeight: 700,
                                  }}
                                >
                                  التقييم: {rating}
                                </p>
                              )}
                              {tajweedList?.length > 0 && (
                                <p
                                  style={{
                                    margin: "4px 0 0",
                                    fontSize: 12,
                                    color: "#dc2626",
                                  }}
                                >
                                  ⚠️ أخطاء التجويد: {tajweedList.join("، ")}
                                </p>
                              )}
                              {notes && (
                                <p
                                  style={{
                                    margin: "4px 0 0",
                                    fontSize: 12,
                                    color: "#6b7280",
                                  }}
                                >
                                  📝 {notes}
                                </p>
                              )}
                            </div>
                          )
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-around",
                            background: "#f9fafb",
                            padding: "12px 8px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            marginBottom: 20,
                          }}
                        >
                          {[
                            ["حضور", previewSession.scores?.att],
                            ["تفاعل", previewSession.scores?.inter],
                            ["إنجاز", previewSession.scores?.ach],
                          ].map(([lb, v]) => (
                            <div key={lb} style={{ textAlign: "center" }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#4b5563",
                                  marginBottom: 4,
                                }}
                              >
                                {lb}
                              </div>
                              <div style={{ fontSize: 12, letterSpacing: 2 }}>
                                {"⭐".repeat(v || 0)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            background: "#f0fdf4",
                            padding: "14px",
                            borderRadius: 10,
                            border: "1px solid #bbf7d0",
                            marginBottom: 16,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: 15,
                              color: "#065f46",
                              margin: "0 0 10px",
                              textAlign: "center",
                              fontWeight: 700,
                            }}
                          >
                            📚 واجب الحلقة القادمة
                          </h3>
                          {previewSession.hw?.new?.surah && (
                            <div style={{ fontSize: 13, marginBottom: 6 }}>
                              <strong style={{ color: "#065f46" }}>
                                ✨ تسميع:
                              </strong>{" "}
                              {previewSession.hw.new.surah}{" "}
                              {previewSession.hw.new.from && (
                                <span style={{ color: "#4b5563" }}>
                                  (من {previewSession.hw.new.from} لـ{" "}
                                  {previewSession.hw.new.to})
                                </span>
                              )}
                            </div>
                          )}
                          {previewSession.hw?.recent?.surah && (
                            <div style={{ fontSize: 13, marginBottom: 6 }}>
                              <strong style={{ color: "#1d4ed8" }}>
                                🔄 قريب:
                              </strong>{" "}
                              {previewSession.hw.recent.surah}{" "}
                              {previewSession.hw.recent.from && (
                                <span style={{ color: "#4b5563" }}>
                                  (من {previewSession.hw.recent.from} لـ{" "}
                                  {previewSession.hw.recent.to})
                                </span>
                              )}
                            </div>
                          )}
                          {previewSession.hw?.distant?.surah && (
                            <div style={{ fontSize: 13 }}>
                              <strong style={{ color: "#92400e" }}>
                                🕰️ بعيد:
                              </strong>{" "}
                              {previewSession.hw.distant.surah}{" "}
                              {previewSession.hw.distant.from && (
                                <span style={{ color: "#4b5563" }}>
                                  (من {previewSession.hw.distant.from} لـ{" "}
                                  {previewSession.hw.distant.to})
                                </span>
                              )}
                            </div>
                          )}
                          {!previewSession.hw?.new?.surah &&
                            !previewSession.hw?.recent?.surah &&
                            !previewSession.hw?.distant?.surah && (
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#9ca3af",
                                  textAlign: "center",
                                }}
                              >
                                لا يوجد واجب مسجل
                              </div>
                            )}
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: 12,
                            color: "#6b7280",
                            fontWeight: 500,
                          }}
                        >
                          الحلقة رقم {previewSession.packageSessionNum} من باقة
                          الـ {limit} حصص
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    padding: "15px",
                    borderTop: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <button
                      onClick={shareImage}
                      style={{
                        flex: 1,
                        background: "var(--c-whatsapp)",
                        color: "#fff",
                        border: "none",
                        padding: "12px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      📤 مشاركة
                    </button>
                    <button
                      onClick={generateImageAndDownload}
                      style={{
                        flex: 1,
                        background: "var(--c-primary)",
                        color: "#fff",
                        border: "none",
                        padding: "12px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ⬇️ حفظ صورة
                    </button>
                  </div>
                  <button
                    onClick={() => loadSession(previewSession)}
                    style={{
                      width: "100%",
                      background: "var(--color-border-secondary)",
                      color: "var(--color-text-primary)",
                      border: "none",
                      padding: "10px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      marginBottom: 8,
                    }}
                  >
                    ✏️ تعديل الجلسة
                  </button>
                  <button
                    onClick={() => setPreviewSession(null)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: "8px",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "inherit",
                    }}
                  >
                    إغلاق (Esc)
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ══ REWARD MODAL ══ */}
      {showReward &&
        (() => {
          const isMonth = showReward.type === "month";
          const isBoy = (showReward.studentGender || "boy") === "boy";
          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="شهادة التقدير"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                zIndex: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 15,
              }}
            >
              <div
                ref={rewardModalRef}
                style={{
                  width: "100%",
                  maxWidth: 400,
                  background: "#fff",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  animation: "popIn .5s cubic-bezier(0.175,0.885,0.32,1.275)",
                  maxHeight: "min(95dvh, 95vh)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  ref={certRef}
                  style={{
                    padding: "25px 20px",
                    background: isMonth
                      ? "linear-gradient(135deg,var(--c-amber-bg),var(--c-amber-light))"
                      : "linear-gradient(135deg,var(--c-primary-bg),var(--c-primary-light))",
                    textAlign: "center",
                    position: "relative",
                    border: isMonth
                      ? "8px solid var(--c-yellow)"
                      : "8px solid var(--c-green)",
                    boxSizing: "border-box",
                    overflowY: "auto",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      marginBottom: 15,
                      animation: "celebrate 0.6s ease-out",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 72,
                        lineHeight: 1,
                        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
                      }}
                    >
                      {isBoy ? "👦🏻" : "🧕🏻"}
                    </div>
                    <div style={{ fontSize: 20, marginTop: 6 }}>
                      {isBoy
                        ? "🎉 صَبِيٌّ مُجْتَهِدٌ 🎉"
                        : "🎊 فَتَاةٌ صَالِحَةٌ 🎊"}
                    </div>
                  </div>
                  <h2
                    style={{
                      margin: "0 0 15px",
                      fontSize: 30,
                      fontFamily: "var(--font-quran)",
                      fontWeight: 700,
                      color: isMonth
                        ? "var(--c-amber-dark)"
                        : "var(--c-primary-dark)",
                      textShadow: "1px 1px 0 #fff",
                    }}
                  >
                    شهادة شكر وتقدير
                  </h2>
                  <p
                    style={{
                      fontSize: 15,
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.7,
                      margin: "0 0 12px",
                    }}
                  >
                    نتقدم بخالص الشكر والتقدير {isBoy ? "للصبي" : "للفتاة"}{" "}
                    {isBoy ? "المتميز" : "المتميزة"}:
                  </p>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginBottom: 12,
                      background: "#fff",
                      padding: "10px",
                      borderRadius: 10,
                      border: isMonth
                        ? "1px dashed var(--c-yellow)"
                        : "1px dashed var(--c-green)",
                    }}
                  >
                    {showReward.name}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.7,
                      margin: "0 0 15px",
                    }}
                  >
                    على {isBoy ? "جهده" : "جهدها"} الرائع في حفظ القرآن الكريم
                    خلال <strong>{isMonth ? "هذا الشهر" : "هذا الأسبوع"}</strong>.
                    <br />
                    <br />
                    نشكر والديه الكرام على حسن المتابعة، ونسأل الله أن يبارك
                    فيه.
                  </p>
                  {showReward.amount && (
                    <div
                      style={{
                        margin: "20px 0",
                        background: "#fff",
                        border: `2px solid ${
                          isMonth
                            ? "var(--c-amber-border)"
                            : "var(--c-primary-mid)"
                        }`,
                        borderRadius: 15,
                        padding: "15px",
                        position: "relative",
                        animation: "popIn 0.8s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 40,
                          position: "absolute",
                          top: "-25px",
                          right: "-15px",
                          animation: "bounce 2s infinite",
                        }}
                      >
                        💰
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: "var(--color-text-primary)",
                          fontWeight: 500,
                          marginBottom: 8,
                        }}
                      >
                        وتقديراً لتفوقه، حصل على مكافأة مالية:
                      </div>
                      <div
                        style={{
                          fontSize: 36,
                          fontWeight: 700,
                          color: "var(--c-amber-dark)",
                          background:
                            "linear-gradient(90deg,var(--c-yellow),var(--c-amber-bg),var(--c-yellow))",
                          backgroundSize: "200% auto",
                          animation: "coinShine 3s linear infinite",
                          display: "inline-block",
                          padding: "5px 20px",
                          borderRadius: 30,
                        }}
                      >
                        {showReward.amount}{" "}
                        <span style={{ fontSize: 18, fontWeight: 500 }}>
                          ج.م
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--c-primary)",
                          fontWeight: 700,
                          marginTop: 8,
                        }}
                      >
                        مُبَارَكٌ لَكَ هَذَا التَّفَوُّقُ! ✨
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      borderTop: isMonth
                        ? "1px solid var(--c-amber-border)"
                        : "1px solid var(--c-primary-mid)",
                      paddingTop: 15,
                      marginTop: 15,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-quran)",
                        fontSize: 18,
                        color: isMonth
                          ? "var(--c-amber-dark)"
                          : "var(--c-primary-dark)",
                        fontWeight: 700,
                      }}
                    >
                      المعلم: {TEACHER}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-tertiary)",
                        marginTop: 5,
                      }}
                    >
                      {getArDate(new Date().toISOString())}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: "15px",
                    background: "#f9fafb",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button
                      onClick={shareAsGif}
                      style={{
                        flex: 1,
                        background: "var(--c-purple)",
                        color: "#fff",
                        border: "none",
                        padding: "12px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      🎬 تصدير GIF
                    </button>
                    <button
                      onClick={downloadCertificate}
                      style={{
                        flex: 1,
                        background: isMonth
                          ? "var(--c-yellow)"
                          : "var(--c-green)",
                        color: "#fff",
                        border: "none",
                        padding: "12px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ⬇️ حفظ 4K
                    </button>
                  </div>
                  <button
                    onClick={() => setShowReward(null)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: "8px",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "inherit",
                    }}
                  >
                    إغلاق (Esc)
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ══ PICKER MODAL ══ */}
      {showPicker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="اختيار الطالب"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            ref={pickerRef}
            style={{
              width: "100%",
              background: "var(--color-background-primary)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "min(80dvh, 80vh)",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp .3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16 }}>اختر الطالب</span>
              <button
                onClick={() => setShowPicker(false)}
                aria-label="إغلاق"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                }}
              >
                ×
              </button>
            </div>
            <input
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="🔍 ابحث عن طالب..."
              style={{
                ...I,
                marginBottom: 12,
                background: "var(--c-primary-bg)",
                border: "1px solid var(--c-primary-border)",
              }}
            />
            <div style={{ overflowY: "auto", flex: 1 }}>
              {students.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: "var(--color-text-tertiary)",
                    lineHeight: 1.6,
                  }}
                >
                  لا يوجد طلاب مسجلين.
                  <br />
                  أضف طلابك من تبويب "الإعدادات" ⚙️
                </div>
              )}
              {students
                .filter(
                  (s) =>
                    pickerSearch.trim() === "" ||
                    s.name.includes(pickerSearch.trim())
                )
                .map((s) => {
                  const limit = s.sessionLimit || settings.defaultLimit || 12;
                  return (
                    <div
                      key={s.id}
                      tabIndex={0}
                      role="option"
                      onClick={() => {
                        setStudent(s);
                        setPkgCountInput(getNextPkgCount(s.id, limit));
                        setPkgCountEditable(false);
                        setShowPicker(false);
                        setPickerSearch("");
                      }}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        (setStudent(s),
                        setPkgCountInput(getNextPkgCount(s.id, limit)),
                        setPkgCountEditable(false),
                        setShowPicker(false),
                        setPickerSearch(""))
                      }
                      style={{
                        padding: 16,
                        borderBottom:
                          "0.5px solid var(--color-border-tertiary)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div>
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 500,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {s.name}{" "}
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--color-text-tertiary)",
                              }}
                            >
                              {s.gender === "girl" ? "♀️" : "♂️"}
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {" "}
                            (الباقة: {getCurrentPkgCount(s.id)}/{limit})
                          </span>
                        </div>
                        {s.schedule?.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 3,
                              marginTop: 4,
                            }}
                          >
                            {s.schedule.map((sl) => (
                              <span
                                key={sl.id}
                                style={{
                                  fontSize: 10,
                                  background: "var(--c-primary-bg)",
                                  color: "var(--c-primary)",
                                  borderRadius: 20,
                                  padding: "1px 6px",
                                }}
                              >
                                {sl.day} {formatTime12h(sl.time)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span style={{ color: "var(--c-primary)", fontSize: 18 }}>
                        ←
                      </span>
                    </div>
                  );
                })}
              {pickerSearch.trim() !== "" &&
                students.filter((s) => s.name.includes(pickerSearch.trim()))
                  .length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "var(--color-text-tertiary)",
                      fontSize: 13,
                    }}
                  >
                    لا يوجد طالب بهذا الاسم 🔍
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  return (
    <ErrorBoundary>
      <DashboardContent user={user} onLogout={onLogout} />
    </ErrorBoundary>
  );
}

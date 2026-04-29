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
import logo from "./logo.png"; // تأكد أن الصورة في مجلد src

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
        <div style={{ textAlign: "center", padding: "60px 20px", direction: "rtl", fontFamily: "Tajawal, sans-serif" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>حدث خطأ غير متوقع</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, maxWidth: 300, margin: "0 auto 20px" }}>
            {this.state.error?.message || "خطأ غير معروف"}
          </div>
          <button onClick={() => window.location.reload()} style={{ background: "#065f46", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, cursor: "pointer" }}>
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
    let localValue = null, localTs = 0;
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
        const data = docSnap.data(), cloudTs = data.updatedAt || 0;
        if (cloudTs >= localTs) {
          localStorage.setItem(k, JSON.stringify({ _v: data.value, _ts: cloudTs }));
          return data.value;
        }
      }
    } catch (fbError) { console.warn("تنبيه فايربيز (جلب):", fbError); }
    return localValue;
  } catch { return null; }
}

async function dbSet(k, v) {
  try {
    const ts = Date.now();
    localStorage.setItem(k, JSON.stringify({ _v: v, _ts: ts }));
    try {
      await setDoc(doc(db, "appData", k), { value: v, updatedAt: ts });
    } catch (fbError) { console.warn("تنبيه فايربيز (حفظ):", fbError); }
  } catch (e) { console.error(e); }
}

// ── Lazy loaders ──────────────────────────────────────────────────────────────
let _htmlToImageState = "idle";
function loadHtmlToImage() {
  return new Promise((resolve, reject) => {
    if (_htmlToImageState === "ready") return resolve();
    if (_htmlToImageState === "loading") {
      const iv = setInterval(() => { if (_htmlToImageState === "ready") { clearInterval(iv); resolve(); } }, 50);
      return;
    }
    _htmlToImageState = "loading";
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js";
    s.onload = () => { _htmlToImageState = "ready"; resolve(); };
    s.onerror = () => { _htmlToImageState = "idle"; reject(new Error("فشل تحميل html-to-image")); };
    document.head.appendChild(s);
  });
}

let _jsPdfState = "idle";
function loadJsPdf() {
  return new Promise((resolve, reject) => {
    if (_jsPdfState === "ready") return resolve();
    if (_jsPdfState === "loading") {
      const iv = setInterval(() => { if (_jsPdfState === "ready") { clearInterval(iv); resolve(); } }, 50);
      return;
    }
    _jsPdfState = "loading";
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => { _jsPdfState = "ready"; resolve(); };
    s.onerror = () => { _jsPdfState = "idle"; reject(new Error("فشل تحميل jsPDF")); };
    document.head.appendChild(s);
  });
}

let _gifState = "idle", _gifWorkerUrl = null;
async function loadGifJs() {
  if (_gifState === "ready") return _gifWorkerUrl;
  if (_gifState === "loading") {
    await new Promise((resolve) => { const iv = setInterval(() => { if (_gifState === "ready") { clearInterval(iv); resolve(); } }, 50); });
    return _gifWorkerUrl;
  }
  _gifState = "loading";
  try {
    if (!window.GIF) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    if (!_gifWorkerUrl) {
      const res = await fetch("https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js");
      _gifWorkerUrl = URL.createObjectURL(new Blob([await res.text()], { type: "text/javascript" }));
    }
    _gifState = "ready"; return _gifWorkerUrl;
  } catch (e) { _gifState = "idle"; throw e; }
}

async function captureElement(el, pixelRatio = 2) {
  await loadHtmlToImage();
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return await window.htmlToImage.toPng(el, { backgroundColor: "#ffffff", pixelRatio, cacheBust: true, useCORS: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function freezeAnimations(el) {
  const nodes = [el, ...el.querySelectorAll("*")];
  const saved = nodes.map((n) => ({ animation: n.style.animation, transition: n.style.transition, animationPlayState: n.style.animationPlayState }));
  nodes.forEach((n) => { n.style.animationPlayState = "paused"; n.style.transition = "none"; });
  return () => nodes.forEach((n, i) => { n.style.animation = saved[i].animation; n.style.transition = saved[i].transition; n.style.animationPlayState = saved[i].animationPlayState; });
}

function dataUrlToCanvas(dataUrl, w, h) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
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
        <span key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(0)} onClick={() => onChange(i === value ? 0 : i)}
          style={{ fontSize: 22, cursor: "pointer", transition: "transform .15s", transform: (hov || value) >= i ? "scale(1.25)" : "scale(1)", filter: (hov || value) >= i ? "none" : "grayscale(1) opacity(.35)", userSelect: "none" }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

function getArDate(iso) {
  try { return new Date(iso).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
  catch { return iso; }
}

function getMonthLabel(year, month) {
  try { return new Date(year, month - 1, 1).toLocaleDateString("ar-EG", { year: "numeric", month: "long" }); }
  catch { return `${year}/${month}`; }
}

function formatTime12h(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hour = parseInt(h), suffix = hour >= 12 ? "م" : "ص";
  return `${hour % 12 || 12}:${m} ${suffix}`;
}

const TAJWEED = ["الإدغام", "الإخفاء", "الإقلاب", "الغنة", "المدود", "الوقف والابتداء", "أخرى"];
const RATINGS = [
  { v: 4, label: "ممتاز ✨", color: "#065f46", bg: "#d1fae5" },
  { v: 3, label: "جيد جداً 👍", color: "#1d4ed8", bg: "#dbeafe" },
  { v: 2, label: "جيد 🙂", color: "#92400e", bg: "#fef3c7" },
  { v: 1, label: "يحتاج مراجعة 📚", color: "#4b5563", bg: "#f3f4f6" },
];
const HIST_PAGE_SIZE = 20;
const PAGE_SIZE_PDF = 10;

const ISLAMIC_CATEGORIES = [
  { id: "asma", label: "أسماء حسنى", icon: "✨", fields: [{ key: "name", label: "الاسم", placeholder: "مثال: الرحمن" }, { key: "notes", label: "ملاحظات التدبر", placeholder: "ما تم تدبره..." }] },
  { id: "hadith", label: "حديث", icon: "📜", fields: [{ key: "text", label: "نص الحديث", placeholder: "نص الحديث الشريف..." }, { key: "notes", label: "ملاحظات", placeholder: "الشرح والتطبيق..." }] },
  { id: "prophet", label: "قصص الأنبياء", icon: "🌟", fields: [{ key: "prophet", label: "اسم النبي", placeholder: "مثال: نوح عليه السلام" }, { key: "notes", label: "الدروس والعبر", placeholder: "ما استفدناه..." }] },
  { id: "story", label: "قصة وعبرة", icon: "📖", fields: [{ key: "title", label: "اسم القصة", placeholder: "عنوان القصة..." }, { key: "lesson", label: "العبرة", placeholder: "العبرة المستفادة..." }] },
  { id: "sahabi", label: "صحابي/صحابية", icon: "🏅", fields: [{ key: "name", label: "اسم الصحابي", placeholder: "مثال: أبو بكر الصديق" }, { key: "notes", label: "أبرز الصفات", placeholder: "صفاته ومناقبه..." }] },
];

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function suggestedSlots(limit) {
  const n = parseInt(limit) || 12;
  if (n <= 4) return 1; if (n <= 8) return 2; if (n <= 12) return 3; if (n <= 16) return 4; return 5;
}

const DEFAULT_DAY_SETS = { 1: ["السبت"], 2: ["السبت", "الثلاثاء"], 3: ["السبت", "الاثنين", "الأربعاء"], 4: ["السبت", "الاثنين", "الأربعاء", "الخميس"], 5: ["السبت", "الأحد", "الاثنين", "الأربعاء", "الخميس"] };

function defaultSchedule(limit) {
  const count = suggestedSlots(limit);
  return (DEFAULT_DAY_SETS[count] || DEFAULT_DAY_SETS[3]).map((day) => ({ id: Date.now() + Math.random(), day, time: "17:00" }));
}

// ── Components ────────────────────────────────────────────────────────────────
function ScheduleEditor({ schedule, onChange, sessionLimit }) {
  const suggested = suggestedSlots(sessionLimit);
  function addSlot() {
    const usedDays = schedule.map((s) => s.day);
    const freeDay = ARABIC_DAYS.find((d) => !usedDays.includes(d)) || "السبت";
    onChange([...schedule, { id: Date.now() + Math.random(), day: freeDay, time: "17:00" }]);
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--c-primary)" }}>🗓️ مواعيد الحلقة</span>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>مقترح: {suggested} مواعيد</span>
      </div>
      {schedule.map((slot, idx) => (
        <div key={slot.id} style={{ display: "flex", gap: 7, marginBottom: 7, background: "var(--color-background-secondary)", borderRadius: 10, padding: 8 }}>
          <select value={slot.day} onChange={(e) => onChange(schedule.map(s => s.id === slot.id ? {...s, day: e.target.value} : s))} style={{ flex: 1, padding: 7, borderRadius: 8, border: "0.5px solid #ccc" }}>
            {ARABIC_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="time" value={slot.time} onChange={(e) => onChange(schedule.map(s => s.id === slot.id ? {...s, time: e.target.value} : s))} style={{ width: 88, padding: 7, borderRadius: 8, border: "0.5px solid #ccc" }} />
          <button onClick={() => onChange(schedule.filter(s => s.id !== slot.id))} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, width: 30 }}>×</button>
        </div>
      ))}
      <button onClick={addSlot} style={{ width: "100%", padding: 8, borderRadius: 10, border: "1px dashed var(--c-primary)", background: "none", cursor: "pointer" }}>➕ إضافة موعد</button>
    </div>
  );
}

function IslamicCategoryBlock({ catId, data, onChange, onRemove }) {
  const cat = ISLAMIC_CATEGORIES.find((c) => c.id === catId);
  if (!cat) return null;
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: 12, marginBottom: 10, border: "0.5px solid #eee" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-primary)" }}>{cat.icon} {cat.label}</span>
        <button onClick={onRemove} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, width: 28 }}>×</button>
      </div>
      {cat.fields.map(f => (
        <div key={f.key}>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 3 }}>{f.label}:</div>
          <textarea value={data[f.key] || ""} onChange={(e) => onChange({ ...data, [f.key]: e.target.value })} placeholder={f.placeholder} style={{ width: "100%", padding: 9, borderRadius: 10, border: "0.5px solid #ddd", marginBottom: 8, height: 50, resize: "none" }} />
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Main Dashboard Content
// ════════════════════════════════════════════════════════════════════════════════
function DashboardContent({ user, onLogout }) {
  const [tab, setTab] = useState("form");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({ accountingPhone: "", defaultLimit: 12, teacherName: "محمد محمود" });
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [sessionType, setSessionType] = useState("quran");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [hifzText, setHifzText] = useState("");
  const [hifzRating, setHifzRating] = useState(null);
  const [tajweed, setTajweed] = useState([]);
  const [hifzNotes, setHifzNotes] = useState("");
  const [recentText, setRecentText] = useState("");
  const [recentRating, setRecentRating] = useState(null);
  const [distantText, setDistantText] = useState("");
  const [distantRating, setDistantRating] = useState(null);
  const [att, setAtt] = useState(0);
  const [inter, setInter] = useState(0);
  const [ach, setAch] = useState(0);
  const [hwNew, setHwNew] = useState({ surah: "", from: "", to: "" });
  const [hwRecent, setHwRecent] = useState({ surah: "", from: "", to: "" });
  const [hwDistant, setHwDistant] = useState({ surah: "", from: "", to: "" });
  const [islamicGeneral, setIslamicGeneral] = useState("");
  const [islamicBlocks, setIslamicBlocks] = useState([]);
  const [islamicHw, setIslamicHw] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [lastSess, setLastSess] = useState(null);
  const [previewSession, setPreviewSession] = useState(null);
  const [showStuForm, setShowStuForm] = useState(false);
  const [editStu, setEditStu] = useState(null);
  const [sfName, setSfName] = useState("");
  const [sfPhone, setSfPhone] = useState("");
  const [sfLimit, setSfLimit] = useState(12);
  const [sfGender, setSfGender] = useState("boy");
  const [sfSchedule, setSfSchedule] = useState([]);
  const [histStu, setHistStu] = useState(null);
  const [toast, setToast] = useState(null);
  const [analysisStudent, setAnalysisStudent] = useState("all");
  const [analysisRange, setAnalysisRange] = useState("all");
  const [pickerSearch, setPickerSearch] = useState("");

  const reportRef = useRef(null);
  const certRef = useRef(null);

  useEffect(() => {
    (async () => {
      const s = await dbGet("hq3-students");
      const ss = await dbGet("hq3-sessions");
      const st = await dbGet("hq3-settings");
      if (s) setStudents(s);
      if (ss) setSessions(ss);
      if (st) setSettings(st);
      setReady(true);
    })();
  }, []);

  const stuAll = useCallback((id) => sessions.filter(s => s.studentId === id).sort((a, b) => new Date(a.date) - new Date(b.date)), [sessions]);
  const getCurrentPkgCount = useCallback((id) => {
    const all = stuAll(id);
    return all.length ? all[all.length - 1].packageSessionNum || 0 : 0;
  }, [stuAll]);

  const showT = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function saveSession() {
    if (!student || saving) return;
    setSaving(true);
    const limit = student.sessionLimit || settings.defaultLimit || 12;
    const current = getCurrentPkgCount(student.id);
    const nextPkgCount = current >= limit ? 1 : current + 1;

    const sessObj = {
      id: Date.now(),
      studentId: student.id,
      studentName: student.name,
      date: sessionDate,
      dateAr: getArDate(sessionDate),
      sessionType,
      packageSessionNum: nextPkgCount,
      isPackageEnd: nextPkgCount === limit,
      overall: Math.round(((att + inter + ach) / 3) * 10) / 10 || 0,
      hifz: { text: hifzText, rating: hifzRating, tajweed, notes: hifzNotes },
      recent: { text: recentText, rating: recentRating },
      distant: { text: distantText, rating: distantRating },
      hw: { new: hwNew, recent: hwRecent, distant: hwDistant },
      islamic: { general: islamicGeneral, blocks: islamicBlocks, hw: islamicHw },
      scores: { att, inter, ach }
    };

    const upd = [...sessions, sessObj];
    setSessions(upd);
    await dbSet("hq3-sessions", upd);
    setLastSess(sessObj);
    setDone(true);
    setSaving(false);
  }

  async function saveStu() {
    const sObj = { id: editStu?.id || Date.now(), name: sfName, phone: sfPhone, sessionLimit: sfLimit, gender: sfGender, schedule: sfSchedule };
    const upd = editStu ? students.map(s => s.id === editStu.id ? sObj : s) : [...students, sObj];
    setStudents(upd);
    await dbSet("hq3-students", upd);
    setShowStuForm(false);
    showT("✅ تم حفظ الطالب");
  }

  const TEACHER = settings.teacherName || "محمد محمود";
  const C_STYLE = { background: "#fff", borderRadius: 14, border: "0.5px solid #eee", padding: 15, marginBottom: 10 };
  const I_STYLE = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd", marginBottom: 8, fontSize: 13, fontFamily: "inherit" };

  if (!ready) return <div style={{ textAlign: "center", padding: 60 }}>جاري التحميل...</div>;

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", direction: "rtl", fontFamily: "Tajawal" }}>
      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#065f46", color: "#fff", padding: "8px 20px", borderRadius: 20, zIndex: 9999 }}>{toast.msg}</div>}

      {/* ── HEADER ── */}
      <div style={{ background: "var(--c-primary, #065f46)", padding: "12px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <button onClick={() => setIsSidebarOpen(true)} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="Logo" style={{ height: 40, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
            <div style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>رفيق المعلم</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "5px 12px", borderRadius: 8, fontSize: 12 }}>خروج</button>
      </div>

      {/* ── SIDEBAR ── */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, backdropFilter: "blur(2px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 280, background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#065f46", padding: 30, color: "#fff" }}>
              <div style={{ fontSize: 20, fontWeight: "800" }}>القائمة الرئيسية</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>أهلاً بك، {TEACHER}</div>
            </div>
            <div style={{ padding: 15, flex: 1 }}>
              {[
                ["form", "🏠", "الرئيسية (تسجيل)"],
                ["history", "📋", "سجلات الطلاب"],
                ["analysis", "📊", "تحليل الأداء"],
                ["monthly", "🗓️", "الجدول والشيت"],
                ["settings", "⚙️", "الإعدادات العامة"],
              ].map(([k, em, lb]) => (
                <button key={k} onClick={() => { setTab(k); setIsSidebarOpen(false); }} style={{ width: "100%", textAlign: "right", padding: 15, marginBottom: 5, borderRadius: 10, border: "none", background: tab === k ? "#f0fdf4" : "none", color: tab === k ? "#065f46" : "#444", display: "flex", gap: 10, cursor: "pointer" }}>
                  <span>{em}</span> {lb}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ padding: 12 }}>
        {tab === "form" && !done && (
          <div>
            <div style={C_STYLE}>
              <button onClick={() => setShowPicker(true)} style={{ ...I_STYLE, textAlign: "right", background: "#f9fafb", cursor: "pointer" }}>
                {student ? "✅ " + student.name : "👤 اختر الطالب..."}
              </button>
              <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={I_STYLE} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setSessionType("quran")} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #065f46", background: sessionType === "quran" ? "#d1fae5" : "#fff" }}>📿 قرآن</button>
                <button onClick={() => setSessionType("islamic")} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #b45309", background: sessionType === "islamic" ? "#fef3c7" : "#fff" }}>📘 تربية</button>
              </div>
            </div>

            {student && sessionType === "quran" && (
              <div style={C_STYLE}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>✨ التسميع الجديد</div>
                <input placeholder="السور والآيات..." value={hifzText} onChange={e => setHifzText(e.target.value)} style={I_STYLE} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                  {RATINGS.map(r => <button key={r.v} onClick={() => setHifzRating(r.v)} style={{ padding: "5px 10px", borderRadius: 20, border: "none", background: hifzRating === r.v ? r.color : "#eee", color: hifzRating === r.v ? "#fff" : "#666" }}>{r.label}</button>)}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>📊 التقييم</div>
                {[["حضور", att, setAtt], ["تفاعل", inter, setInter], ["إنجاز", ach, setAch]].map(([l, v, s]) => (
                  <div key={l} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "#666" }}>{l}</div>
                    <Stars value={v} onChange={s} />
                  </div>
                ))}
                <button onClick={saveSession} style={{ width: "100%", padding: 15, background: "#065f46", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700 }}>💾 حفظ الجلسة</button>
              </div>
            )}

            {student && sessionType === "islamic" && (
              <div style={C_STYLE}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>📘 محتوى الحصة</div>
                <textarea placeholder="ما تم شرحه..." value={islamicGeneral} onChange={e => setIslamicGeneral(e.target.value)} style={{ ...I_STYLE, height: 100, resize: "none" }} />
                <button onClick={saveSession} style={{ width: "100%", padding: 15, background: "#b45309", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700 }}>💾 حفظ حصة التربية</button>
              </div>
            )}
          </div>
        )}

        {tab === "form" && done && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 60 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#065f46" }}>تم الحفظ بنجاح</div>
            <p>{lastSess?.studentName} - حصة {lastSess?.packageSessionNum}</p>
            <button onClick={() => { setDone(false); setStudent(null); }} style={{ padding: "10px 20px", borderRadius: 10, background: "#065f46", color: "#fff", border: "none" }}>إضافة جلسة جديدة</button>
          </div>
        )}

        {tab === "history" && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 15 }}>📋 سجل الجلسات الأخيرة</div>
            {[...sessions].reverse().slice(0, 20).map(s => (
              <div key={s.id} style={{ ...C_STYLE, borderRight: s.sessionType === "quran" ? "5px solid #065f46" : "5px solid #b45309" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontWeight: 700 }}>{s.studentName}</span>
                  <span style={{ fontSize: 11, color: "#888" }}>{s.dateAr}</span>
                </div>
                <div style={{ fontSize: 13, color: "#444" }}>{s.sessionType === "quran" ? `📖 قرآن: ${s.hifz.text}` : `📘 تربية: ${s.islamic.general}`}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
          <div>
            <div style={C_STYLE}>
              <div style={{ fontWeight: 700, marginBottom: 15 }}>⚙️ إعدادات المعلم</div>
              <input value={settings.teacherName} onChange={e => setSettings({...settings, teacherName: e.target.value})} placeholder="اسم المعلم" style={I_STYLE} />
              <button onClick={() => dbSet("hq3-settings", settings)} style={{ width: "100%", padding: 12, background: "#065f46", color: "#fff", border: "none", borderRadius: 10 }}>حفظ الإعدادات</button>
            </div>
            <div style={C_STYLE}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                <span style={{ fontWeight: 700 }}>👥 إدارة الطلاب</span>
                <button onClick={() => { setEditStu(null); setSfName(""); setSfPhone(""); setShowStuForm(true); }} style={{ padding: "5px 15px", background: "#d1fae5", color: "#065f46", border: "none", borderRadius: 8, fontSize: 12 }}>+ طالب جديد</button>
              </div>
              {students.map(s => (
                <div key={s.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                  <span>{s.name} {s.gender === "girl" ? "♀️" : "♂️"}</span>
                  <button onClick={() => { setEditStu(s); setSfName(s.name); setSfPhone(s.phone); setShowStuForm(true); }} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>تعديل</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* بقية التابات (Analysis, Monthly) ممكن تكملها بنفس النمط... */}
      </div>

      {/* ── PICKER MODAL ── */}
      {showPicker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
              <span style={{ fontWeight: 700 }}>اختر طالب</span>
              <button onClick={() => setShowPicker(false)} style={{ border: "none", background: "none", fontSize: 24 }}>×</button>
            </div>
            <input placeholder="🔍 ابحث..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} style={I_STYLE} />
            {students.filter(s => s.name.includes(pickerSearch)).map(s => (
              <div key={s.id} onClick={() => { setStudent(s); setShowPicker(false); }} style={{ padding: 15, borderBottom: "1px solid #eee", cursor: "pointer" }}>{s.name}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── STUDENT FORM MODAL ── */}
      {showStuForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 400 }}>
            <div style={{ fontWeight: 700, marginBottom: 15 }}>{editStu ? "تعديل طالب" : "إضافة طالب جديد"}</div>
            <input placeholder="الاسم" value={sfName} onChange={e => setSfName(e.target.value)} style={I_STYLE} />
            <input placeholder="رقم الواتساب" value={sfPhone} onChange={e => setSfPhone(e.target.value)} style={I_STYLE} />
            <select value={sfGender} onChange={e => setSfGender(e.target.value)} style={I_STYLE}>
              <option value="boy">ولد</option>
              <option value="girl">بنت</option>
            </select>
            <button onClick={saveStu} style={{ width: "100%", padding: 12, background: "#065f46", color: "#fff", border: "none", borderRadius: 10 }}>حفظ الطالب</button>
            <button onClick={() => setShowStuForm(false)} style={{ width: "100%", padding: 10, background: "none", border: "none", color: "#999", marginTop: 5 }}>إلغاء</button>
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

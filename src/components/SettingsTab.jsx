import React, { useState } from 'react';
import ScheduleEditor from './ScheduleEditor';

export default function SettingsTab({ students, addStudent, updateStudent, deleteStudent, settings, setSettings }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("boy");
  const [limit, setLimit] = useState(settings.defaultLimit || 12);
  const [schedule, setSchedule] = useState([]);

  // Settings State
  const [teacherName, setTeacherName] = useState(settings.teacherName || "");
  const [defaultLimit, setDefaultLimit] = useState(settings.defaultLimit || 12);

  const openAdd = () => {
    setEditId(null); setName(""); setPhone(""); setGender("boy"); 
    setLimit(settings.defaultLimit || 12); setSchedule([]); setShowForm(true);
  };

  const openEdit = (stu) => {
    setEditId(stu.id); setName(stu.name); setPhone(stu.phone || ""); 
    setGender(stu.gender || "boy"); setLimit(stu.sessionLimit || 12); 
    setSchedule(stu.schedule || []); setShowForm(true);
  };

  const handleSaveStudent = () => {
    if (!name.trim()) return;
    const studentData = { name: name.trim(), phone: phone.trim(), gender, sessionLimit: parseInt(limit) || 12, schedule };
    
    if (editId) updateStudent(editId, studentData);
    else addStudent(studentData);
    
    setShowForm(false);
  };

  const handleSaveSettings = () => {
    setSettings({ ...settings, teacherName, defaultLimit: parseInt(defaultLimit) || 12 });
    alert("✅ تم حفظ الإعدادات بنجاح");
  };

  const cardStyle = { background: "#ffffff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" };
  const inputStyle = { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#f9fafb", color: "#1C1C2E", outline: "none", marginBottom: "12px", fontFamily: "inherit" };

  if (showForm) {
    return (
      <div className="student-form-wrap" style={{ animation: "fadeUp 0.3s ease" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: "#0D5C3A" }}>{editId ? "✏️ تعديل بيانات الطالب" : "➕ إضافة طالب جديد"}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#9ca3af" }}>×</button>
          </div>

          <label style={{ fontSize: "12px", color: "#4b5563", marginBottom: "6px", display: "block", fontWeight: 700 }}>اسم الطالب:</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="الاسم ثلاثي..." />

          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <button onClick={() => setGender("boy")} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: gender === "boy" ? "2px solid #0D5C3A" : "1px solid #e5e7eb", background: gender === "boy" ? "#f0fdf4" : "#fff", fontWeight: 700, color: gender === "boy" ? "#0D5C3A" : "#9ca3af", cursor: "pointer" }}>👦🏻 ولد</button>
            <button onClick={() => setGender("girl")} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: gender === "girl" ? "2px solid #C9973A" : "1px solid #e5e7eb", background: gender === "girl" ? "#FDFAF3" : "#fff", fontWeight: 700, color: gender === "girl" ? "#C9973A" : "#9ca3af", cursor: "pointer" }}>🧕🏻 بنت</button>
          </div>

          <label style={{ fontSize: "12px", color: "#4b5563", marginBottom: "6px", display: "block", fontWeight: 700 }}>رقم واتساب ولي الأمر:</label>
          <input style={{ ...inputStyle, direction: "ltr" }} value={phone} onChange={e => setPhone(e.target.value)} placeholder="مثال: 201012345678" type="tel" />

          <label style={{ fontSize: "12px", color: "#4b5563", marginBottom: "6px", display: "block", fontWeight: 700 }}>سعة الباقة (عدد الحصص):</label>
          <input style={inputStyle} value={limit} onChange={e => setLimit(e.target.value)} type="number" />

          <div style={{ padding: "15px", background: "#f9fafb", borderRadius: "12px", marginBottom: "20px", border: "1px solid #e5e7eb" }}>
            <ScheduleEditor schedule={schedule} onChange={setSchedule} sessionLimit={limit} />
          </div>

          <button onClick={handleSaveStudent} disabled={!name.trim()} style={{ width: "100%", background: "#0D5C3A", color: "#fff", padding: "14px", borderRadius: "12px", border: "none", fontWeight: 700, fontSize: "15px", cursor: name.trim() ? "pointer" : "not-allowed", opacity: name.trim() ? 1 : 0.5 }}>
            💾 حفظ بيانات الطالب
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-wrap" style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Settings Section */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", color: "#0D5C3A", display: "flex", alignItems: "center", gap: "8px" }}>⚙️ إعدادات المنصة</h3>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#4b5563" }}>اسم المعلم (لإصدار الشهادات):</label>
        <input style={inputStyle} value={teacherName} onChange={e => setTeacherName(e.target.value)} />
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#4b5563" }}>الحد الافتراضي للباقة:</label>
        <input style={inputStyle} type="number" value={defaultLimit} onChange={e => setDefaultLimit(e.target.value)} />
        <button onClick={handleSaveSettings} style={{ background: "#C9973A", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>حفظ الإعدادات</button>
      </div>

      {/* Students List Section */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#0D5C3A" }}>👥 إدارة الطلاب ({students.length})</h3>
          <button onClick={openAdd} style={{ background: "#0D5C3A", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>➕ طالب جديد</button>
        </div>

        {students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#9ca3af", background: "#f9fafb", borderRadius: "12px" }}>لا يوجد طلاب مسجلين بعد.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {students.map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fff" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1C1C2E", fontSize: "15px" }}>{s.gender === "girl" ? "🧕🏻" : "👦🏻"} {s.name}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>الباقة: {s.sessionLimit || 12} حصة | المواعيد: {s.schedule?.length || 0}</div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => openEdit(s)} style={{ background: "#f3f4f6", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer" }}>✏️</button>
                  <button onClick={() => window.confirm("متأكد من الحذف؟") && deleteStudent(s.id)} style={{ background: "#fee2e2", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer" }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
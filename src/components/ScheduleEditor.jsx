import React from "react";

const ARABIC_DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export default function ScheduleEditor({ schedule, onChange, sessionLimit }) {
  const suggested = Math.ceil((parseInt(sessionLimit) || 12) / 4);

  function addSlot() {
    const usedDays = schedule.map((s) => s.day);
    const freeDay = ARABIC_DAYS.find((d) => !usedDays.includes(d)) || "السبت";
    onChange([
      ...schedule,
      { id: crypto.randomUUID(), day: freeDay, time: "17:00" },
    ]);
  }

  function removeSlot(id) {
    onChange(schedule.filter((s) => s.id !== id));
  }
  function updateSlot(id, field, value) {
    onChange(schedule.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  const inputStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
    background: "#fff",
    color: "#1C1C2E",
  };

  return (
    <div className="schedule-wrapper">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>🗓️</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0D5C3A" }}>
            مواعيد الحلقة الأسبوعية
          </span>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#C9973A",
            background: "#FDFAF3",
            padding: "4px 10px",
            borderRadius: "20px",
            border: "1px solid #C9973A",
          }}
        >
          مقترح: {suggested} مواعيد
        </div>
      </div>

      {schedule.map((slot, idx) => (
        <div
          key={slot.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            background: "#f9fafb",
            borderRadius: "10px",
            padding: "8px 10px",
            border: "1px solid #e5e7eb",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              minWidth: "18px",
              textAlign: "center",
            }}
          >
            {idx + 1}
          </span>
          <select
            value={slot.day}
            onChange={(e) => updateSlot(slot.id, "day", e.target.value)}
            style={{ ...inputStyle, flex: 1, direction: "rtl" }}
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
            style={{ ...inputStyle, direction: "ltr", minWidth: "90px" }}
          />
          <button
            onClick={() => removeSlot(slot.id)}
            style={{
              background: "#fee2e2",
              color: "#9B1D3A",
              border: "none",
              borderRadius: "8px",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              fontWeight: "bold",
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
          background: "#f0fdf4",
          color: "#0D5C3A",
          border: "1px dashed #0D5C3A",
          borderRadius: "10px",
          padding: "10px",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          marginTop: "4px",
          transition: "all 0.2s",
        }}
      >
        ➕ إضافة موعد جديد
      </button>
    </div>
  );
}

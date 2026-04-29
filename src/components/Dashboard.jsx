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

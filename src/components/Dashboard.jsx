import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

const Dashboard = ({ user, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [surah, setSurah] = useState("");
  const [ayah, setAyah] = useState("");

  // جلب بيانات الأبطال الخاصة بالمعلم الحالي فقط
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "students"), where("tutorId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // ترتيب الطلاب بحيث يظهر الأحدث أولاً
      setStudents(studentsData.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsubscribe();
  }, [user]);

  // إضافة بطل جديد
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addDoc(collection(db, "students"), {
        tutorId: user.uid,
        name,
        surah,
        ayah,
        createdAt: new Date()
      });
      setName(""); setSurah(""); setAyah("");
    } catch (error) {
      console.error("خطأ في إضافة البيانات: ", error);
    }
  };

  // تحديث الحفظ (السورة أو الآية)
  const handleUpdate = async (id, field, value) => {
    try {
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, { [field]: value });
    } catch (error) {
      console.error("خطأ في تحديث البيانات: ", error);
    }
  };

  // حذف طالب
  const handleDelete = async (id) => {
    if(window.confirm("هل أنت متأكد من حذف هذا البطل من السجل؟")) {
        try {
          await deleteDoc(doc(db, "students", id));
        } catch (error) {
          console.error("خطأ في الحذف: ", error);
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black p-4 md:p-8" dir="rtl">
      
      {/* الشريط العلوي (Header) */}
      <div className="w-full bg-blue-600 text-white p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">سجل متابعة الأبطال</h1>
          <p className="text-blue-100 text-sm">مرحباً بك: {user.email}</p>
        </div>
        <button 
          onClick={onLogout} 
          className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg transition duration-300 shadow-sm"
        >
          تسجيل الخروج
        </button>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-8">
        
        {/* نموذج إضافة طالب جديد */}
        <div className="w-full lg:w-1/3 bg-white p-6 rounded-xl shadow-md h-fit border-t-4 border-black">
          <h2 className="text-xl font-bold mb-6 text-blue-600">إضافة بطل جديد لحلقتك</h2>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">اسم البطل:</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-right bg-gray-50"
                placeholder="مثال: أحمد محمود"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-bold mb-2">سورة:</label>
                <input 
                  type="text" 
                  value={surah} 
                  onChange={(e) => setSurah(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-right bg-gray-50"
                  placeholder="مثال: البقرة"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-bold mb-2">آية:</label>
                <input 
                  type="number" 
                  value={ayah} 
                  onChange={(e) => setAyah(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-right bg-gray-50"
                  placeholder="رقم الآية"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 mt-4">
              إضافة للسجل
            </button>
          </form>
        </div>

        {/* قائمة الطلاب (جدول المتابعة) */}
        <div className="w-full lg:w-2/3 bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600">
          <h2 className="text-xl font-bold mb-6 text-black">قائمة الأبطال ومستوى الحفظ</h2>
          
          {students.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">لم تقم بإضافة أي أبطال حتى الآن.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((student) => (
                <div key={student.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group hover:shadow-md transition">
                  <button 
                    onClick={() => handleDelete(student.id)}
                    className="absolute top-3 left-3 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="حذف الطالب"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  
                  <h3 className="font-bold text-lg text-black mb-3 pr-2 border-r-4 border-blue-600">{student.name}</h3>
                  
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">السورة الحالية</label>
                      <input 
                        type="text" 
                        value={student.surah}
                        onChange={(e) => handleUpdate(student.id, "surah", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">رقم الآية</label>
                      <input 
                        type="number" 
                        value={student.ayah}
                        onChange={(e) => handleUpdate(student.id, "ayah", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { dbGetSaaS, dbSetSaaS, generateId, auth } from "../services/db";
import { onAuthStateChanged, signOut } from "firebase/auth";

export function useAppStore() {
  const [user, setUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [ready, setReady] = useState(false);

  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({
    accountingPhone: "",
    defaultLimit: 12,
    teacherName: "محمد محمود",
  });

  useEffect(() => {
    // مراقبة حالة تسجيل الدخول
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthResolved(true);

      if (currentUser) {
        // لو مسجل دخول، حمل بياناته هو بس
        const [loadedStudents, loadedSessions, loadedSettings] =
          await Promise.all([
            dbGetSaaS("students"),
            dbGetSaaS("sessions"),
            dbGetSaaS("settings"),
          ]);
        if (loadedStudents)
          setStudents(loadedStudents.filter((s) => !s.deletedAt));
        if (loadedSessions) setSessions(loadedSessions);
        if (loadedSettings) setSettings(loadedSettings);
        setReady(true);
      } else {
        // لو خرج، فضي الداتا من الشاشة
        setStudents([]);
        setSessions([]);
        setReady(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const addStudent = async (studentData) => {
    const newStudent = {
      ...studentData,
      id: generateId(),
      createdAt: Date.now(),
    };
    const updated = [...students, newStudent];
    setStudents(updated);
    await dbSetSaaS("students", updated);
  };

  const updateStudent = async (id, studentData) => {
    const updated = students.map((s) =>
      s.id === id ? { ...s, ...studentData } : s
    );
    setStudents(updated);
    await dbSetSaaS("students", updated);
  };

  const deleteStudent = async (id) => {
    const updated = students.map((s) =>
      s.id === id ? { ...s, deletedAt: Date.now() } : s
    );
    setStudents(updated.filter((s) => !s.deletedAt));
    await dbSetSaaS("students", updated);
  };

  const addSession = async (sessionData) => {
    const newSession = { ...sessionData, id: generateId() };
    const updated = [...sessions, newSession];
    setSessions(updated);
    await dbSetSaaS("sessions", updated);
    return newSession;
  };

  return {
    user,
    authResolved,
    ready,
    students,
    sessions,
    settings,
    addStudent,
    updateStudent,
    deleteStudent,
    addSession,
    handleLogout,
    setSettings: async (newSettings) => {
      setSettings(newSettings);
      await dbSetSaaS("settings", newSettings);
    },
  };
}

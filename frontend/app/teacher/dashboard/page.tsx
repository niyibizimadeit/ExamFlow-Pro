"use client";

// app/teacher/dashboard/page.tsx — Teacher Dashboard (Phase 2)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") {
      clearToken();
      router.push("/login");
      return;
    }
    setUser({ fullName: payload.name, role: payload.role });
  }, [router]);

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8">
        <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your question bank and exam papers.</p>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {["My Papers", "Total Questions", "Active Exams"].map((label) => (
            <div key={label} className="bg-white rounded-xl shadow p-6 border border-gray-100">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-green-600 mt-2">—</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-gray-400">Full implementation in Phases 3–5.</p>
      </main>
    </>
  );
}

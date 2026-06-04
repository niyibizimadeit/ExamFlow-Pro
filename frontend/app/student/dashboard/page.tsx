"use client";

// app/student/dashboard/page.tsx — Student Dashboard (Phase 2)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") {
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
        <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Your available exams, scores, and wrong answer notebook.</p>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {["Available Exams", "Completed Exams", "My Average Score"].map((label) => (
            <div key={label} className="bg-white rounded-xl shadow p-6 border border-gray-100">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">—</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-gray-400">Full implementation in Phases 6–9.</p>
      </main>
    </>
  );
}

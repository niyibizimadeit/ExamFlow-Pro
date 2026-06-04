"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "ADMIN") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/admin/stats").then(r => setStats(r.data.data));
  }, [router]);

  if (!user || !stats) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, href: "/admin/users", gradient: "from-indigo-500 to-blue-600" },
    { label: "Teachers", value: stats.totalTeachers, href: "/admin/users", gradient: "from-emerald-500 to-teal-600" },
    { label: "Students", value: stats.totalStudents, href: "/admin/users", gradient: "from-violet-500 to-purple-600" },
    { label: "Exam Papers", value: stats.totalPapers, gradient: "from-amber-500 to-orange-600" },
    { label: "Exams Taken", value: stats.totalSessions, gradient: "from-rose-500 to-pink-600" },
    { label: "Avg Score", value: stats.systemAvgScore, gradient: "from-cyan-500 to-sky-600" },
  ];

  const passRate = Math.round(Number(stats.passRate || 0) * 100);

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">System overview and management</p>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-8">
          {cards.map(c => (
            <Link
              key={c.label}
              href={c.href || "#"}
              className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.label}</p>
                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${c.gradient}`} />
              </div>
              <p className="text-3xl font-bold text-slate-800 tracking-tight">{String(c.value)}</p>
            </Link>
          ))}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Overall Pass Rate</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-700" style={{ width: `${passRate}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-600 tabular-nums w-12 text-right">{passRate}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Link href="/admin/users" className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all p-5 group">
            <h3 className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">User Management</h3>
            <p className="text-sm text-slate-400 mt-1">View and manage all system users</p>
          </Link>
          <div className="bg-white/40 rounded-2xl border border-slate-200/40 p-5 opacity-60">
            <h3 className="font-semibold text-slate-700">System Settings</h3>
            <p className="text-sm text-slate-400 mt-1">Coming soon</p>
          </div>
        </div>
      </main>
    </>
  );
}

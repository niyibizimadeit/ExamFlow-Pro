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
    { label: "Total Users", value: String(stats.totalUsers || 0), href: "/admin/users", accent: "from-indigo-500 to-blue-500" },
    { label: "Teachers", value: String(stats.totalTeachers || 0), href: "/admin/users", accent: "from-emerald-500 to-teal-500" },
    { label: "Students", value: String(stats.totalStudents || 0), href: "/admin/users", accent: "from-violet-500 to-purple-500" },
    { label: "Exam Papers", value: String(stats.totalPapers || 0), href: "#", accent: "from-amber-500 to-orange-500" },
    { label: "Exams Taken", value: String(stats.totalSessions || 0), href: "#", accent: "from-rose-500 to-pink-500" },
    { label: "Average Score", value: String(stats.systemAvgScore || 0), href: "#", accent: "from-cyan-500 to-sky-500" },
  ];

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-subtitle">System overview and management</p>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-8">
          {cards.map(c => (
            <Link key={c.label} href={c.href} className="glass p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.label}</p>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${c.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
              </div>
              <p className="text-3xl font-bold text-slate-800 mt-3 tracking-tight">{c.value}</p>
            </Link>
          ))}
        </div>

        <div className="glass p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Overall Pass Rate</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.round(Number(stats.passRate || 0) * 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-600 tabular-nums w-12 text-right">
              {Math.round(Number(stats.passRate || 0) * 100)}%
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5">
          <Link href="/admin/users" className="glass p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
            <h3 className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">User Management</h3>
            <p className="text-sm text-slate-400 mt-1">View and manage all system users</p>
          </Link>
          <div className="glass p-5 opacity-50">
            <h3 className="font-semibold text-slate-700">System Settings</h3>
            <p className="text-sm text-slate-400 mt-1">Coming soon</p>
          </div>
        </div>
      </main>
    </>
  );
}

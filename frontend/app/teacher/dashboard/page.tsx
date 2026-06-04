"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import NavBar from "@/components/NavBar";

const modules = [
  {
    label: "Question Bank",
    desc: "Create and manage questions across all types and categories",
    href: "/teacher/questions",
    gradient: "from-indigo-500 to-blue-600",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    label: "Exam Papers",
    desc: "Build exam papers with manual selection or rule-based assembly",
    href: "/teacher/papers",
    gradient: "from-emerald-500 to-teal-600",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    label: "Results",
    desc: "View student scores, statistics, and performance charts",
    href: "/teacher/papers",
    gradient: "from-violet-500 to-purple-600",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
  }, [router]);

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Teacher Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">Manage questions, exams, and view student performance</p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {modules.map(m => (
            <Link
              key={m.label}
              href={m.href}
              className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                {m.icon}
              </div>
              <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{m.label}</h3>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{m.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

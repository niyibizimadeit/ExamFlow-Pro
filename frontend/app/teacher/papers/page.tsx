"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function PapersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [papers, setPapers] = useState<{ id: number; title: string; status: string; durationMins: number; totalScore: number; questionCount: number }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/papers").then(r => setPapers(r.data.data));
  }, [router]);

  const statusStyle = (s: string) => {
    if (s === "PUBLISHED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "ENDED") return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Exam Papers</h1>
            <p className="text-slate-500 text-sm mt-1">{papers.length} papers</p>
          </div>
          <Link href="/teacher/papers/new" className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all">Create Paper</Link>
        </div>

        <div className="space-y-3">
          {papers.map(p => (
            <div key={p.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-slate-800">{p.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusStyle(p.status)}`}>{p.status}</span>
                </div>
                <p className="text-sm text-slate-400">{p.durationMins} min &middot; {p.totalScore} pts &middot; {p.questionCount} questions</p>
              </div>
              <div className="flex gap-2">
                {p.status === "DRAFT" && (
                  <Link href={`/teacher/papers/${p.id}/build`} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all">Build</Link>
                )}
                {p.status !== "DRAFT" && (
                  <Link href={`/teacher/papers/${p.id}/results`} className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white/60 text-slate-600 hover:bg-white transition-colors">Results</Link>
                )}
              </div>
            </div>
          ))}
          {papers.length === 0 && (
            <div className="bg-white/50 rounded-2xl border border-slate-100 p-16 text-center text-sm text-slate-400">No papers yet. Create your first exam.</div>
          )}
        </div>
      </main>
    </>
  );
}

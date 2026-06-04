"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [papers, setPapers] = useState<{ id: number; title: string; durationMins: number; totalScore: number; status: string; questionCount: number }[]>([]);
  const [scores, setScores] = useState<{ id: number; sessionId: number; paperId: number; paperTitle: string; totalScore: number; paperTotalScore: number; passed: boolean }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/papers")
      .then(r => setPapers((r.data.data || []).filter((p: { status: string }) => p.status === "PUBLISHED")))
      .catch(() => setPapers([]));
    api.get("/api/scores/my")
      .then(r => setScores(r.data.data || []))
      .catch(() => setScores([]));
  }, [router]);

  if (!user) return null;

  const takenIds = new Set(scores.map(s => s.paperId));
  const available = papers.filter(p => !takenIds.has(p.id));

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Available exams and your results</p>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Available Exams</h2>
          <div className="space-y-3">
            {available.map(p => (
              <div key={p.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{p.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{p.durationMins} min &middot; {p.questionCount} questions &middot; {p.totalScore} pts</p>
                </div>
                <Link href={`/student/exam/${p.id}`} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all">Begin Exam</Link>
              </div>
            ))}
            {available.length === 0 && (
              <div className="bg-white/50 rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">No exams available</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Your Results</h2>
            <Link href="/student/wrong-answers" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Wrong Answer Notebook</Link>
          </div>
          <div className="space-y-2">
            {scores.map(s => (
              <Link key={s.id} href={`/student/results/${s.id}`} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all p-4 flex items-center justify-between group">
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{s.paperTitle}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{s.totalScore} / {s.paperTotalScore} points</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${s.passed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {s.passed ? "Passed" : "Failed"}
                </span>
              </Link>
            ))}
            {scores.length === 0 && (
              <div className="bg-white/50 rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">No completed exams</div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

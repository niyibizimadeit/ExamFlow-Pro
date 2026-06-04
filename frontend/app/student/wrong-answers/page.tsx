"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function WrongAnswersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [wrong, setWrong] = useState<{ questionId: number; questionContent: string; questionType: string; answerGiven: string; correctAnswer: string; scoreEarned: number; maxScore: number; explanation: string }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/scores/wrong/all")
      .then(r => setWrong(r.data.data || []))
      .catch(() => setWrong([]));
  }, [router]);

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Wrong Answer Notebook</h1>
            <p className="text-slate-500 text-sm mt-1">{wrong.length} questions to review</p>
          </div>
          <Link href="/student/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Dashboard</Link>
        </div>

        {wrong.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/></svg>
            </div>
            <p className="text-slate-500 font-medium">No wrong answers to review</p>
            <p className="text-sm text-slate-400 mt-1">Outstanding performance across all exams</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wrong.map((a, i) => (
              <div key={`${a.questionId}-${i}`} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm border-l-2 border-l-red-400 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{a.questionType}</span>
                  <span className="text-xs text-slate-400">{a.scoreEarned}/{a.maxScore} pts</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-3">{a.questionContent}</p>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/60 rounded-xl p-3">
                  <div><span className="text-slate-400">Your answer: </span><span className="text-red-500 font-medium">{a.answerGiven || "(unanswered)"}</span></div>
                  <div><span className="text-slate-400">Correct: </span><span className="text-emerald-600 font-medium">{a.correctAnswer}</span></div>
                </div>
                {a.explanation && (
                  <details className="mt-3">
                    <summary className="text-xs font-medium text-indigo-600 cursor-pointer hover:text-indigo-500">Explanation</summary>
                    <p className="text-xs text-slate-500 mt-2 p-3 bg-indigo-50/50 rounded-xl">{a.explanation}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

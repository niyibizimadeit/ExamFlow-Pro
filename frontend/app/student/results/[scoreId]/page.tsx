"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function ResultDetailPage() {
  const router = useRouter();
  const { scoreId } = useParams<{ scoreId: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [detail, setDetail] = useState<{ id: number; sessionId: number; paperTitle: string; score: number; totalScore: number; passed: boolean; gradedAt: string; answers: { questionId: number; questionContent: string; questionType: string; answerGiven: string; correctAnswer: string; isCorrect: boolean; scoreEarned: number; maxScore: number; explanation: string }[] } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/scores/my")
      .then(r => {
        const score = (r.data.data || []).find((s: Record<string, unknown>) => s.id === parseInt(scoreId));
        if (score?.sessionId) {
          api.get(`/api/scores/detail/${score.sessionId}`)
            .then(r2 => setDetail(r2.data.data))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [router, scoreId]);

  if (!user || !detail) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  const pct = detail.totalScore > 0 ? Math.round((detail.score / detail.totalScore) * 100) : 0;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-3xl mx-auto">
        <Link href="/student/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Back to Dashboard</Link>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6 mt-4 mb-8">
          <h1 className="text-xl font-bold text-slate-800">{detail.paperTitle}</h1>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-3xl font-bold text-slate-800 tabular-nums">{detail.score}<span className="text-lg text-slate-400 font-normal">/{detail.totalScore}</span></span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${detail.passed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>{detail.passed ? "Passed" : "Failed"}</span>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${detail.passed ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-400 to-rose-500"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Question Breakdown</h2>
        <div className="space-y-3">
          {detail.answers.map((a, i) => (
            <div key={a.questionId} className={`bg-white/70 backdrop-blur-sm rounded-2xl border shadow-sm p-5 ${a.isCorrect ? "border-l-2 border-l-emerald-400 border-slate-200/60" : "border-l-2 border-l-red-400 border-slate-200/60"}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-slate-800">{i + 1}. {a.questionContent}</p>
                <span className={`text-xs font-bold ml-2 shrink-0 ${a.isCorrect ? "text-emerald-600" : "text-red-500"}`}>{a.scoreEarned}/{a.maxScore}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Your answer: </span><span className={a.isCorrect ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>{a.answerGiven || "(unanswered)"}</span></div>
                {!a.isCorrect && <div><span className="text-slate-400">Correct: </span><span className="text-emerald-600 font-medium">{a.correctAnswer}</span></div>}
              </div>
              {a.explanation && <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">{a.explanation}</p>}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

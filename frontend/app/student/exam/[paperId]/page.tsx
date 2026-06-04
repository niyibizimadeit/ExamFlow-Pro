"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";

export default function ExamPage() {
  const router = useRouter();
  const { paperId } = useParams<{ paperId: string }>();
  const [session, setSession] = useState<{ id: number; paperTitle: string; durationMins: number; totalScore: number; status: string; startTime: string; answeredCount: number; totalQuestions: number; questions: { id: number; content: string; type: string; orderNum: number; score: number; options: { label: string; content: string }[]; savedAnswer: string }[] } | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef(answers);
  ref.current = answers;

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const p = decodeToken(token);
    if (!p || p.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    api.get("/api/scores/my")
      .then(r => {
        if ((r.data.data || []).find((s: Record<string, unknown>) => s.paperId === parseInt(paperId))) {
          alert("Exam already completed."); router.push("/student/dashboard"); return;
        }
        api.post(`/api/sessions/start/${paperId}`).then(r2 => {
          const s = r2.data.data; setSession(s);
          const a: Record<number, string> = {};
          s.questions.forEach((q: { id: number; savedAnswer: string }) => { if (q.savedAnswer) a[q.id] = q.savedAnswer; });
          setAnswers(a);
          setTimeLeft(Math.max(0, Math.floor((new Date(s.startTime).getTime() + s.durationMins * 60000 - Date.now()) / 1000)));
        }).catch((err: unknown) => { alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error"); router.push("/student/dashboard"); });
      })
      .catch(() => { alert("Failed to load exam. Please try again."); router.push("/student/dashboard"); });
  }, []);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => { if (timeLeft <= 0) return; const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000); return () => clearInterval(t); }, [timeLeft]);
  useEffect(() => { if (timeLeft === 0 && sessionRef.current?.status === "IN_PROGRESS") submit(); }, [timeLeft]);
  useEffect(() => { if (!session) return; const t = setInterval(() => { if (Object.keys(ref.current).length && sessionRef.current?.status === "IN_PROGRESS") api.put(`/api/sessions/${sessionRef.current.id}/answers`, { answers: ref.current }).catch(() => {}); }, 30000); return () => clearInterval(t); }, [session]);

  async function submit() {
    if (submitting) return; setSubmitting(true);
    try { await api.put(`/api/sessions/${session!.id}/answers`, { answers: ref.current }); await api.post(`/api/sessions/${session!.id}/submit`); router.push("/student/dashboard"); }
    catch { setSubmitting(false); }
  }

  function ans(qId: number, v: string) { setAnswers(p => ({ ...p, [qId]: v })); ref.current = { ...ref.current, [qId]: v }; }
  function toggle(qId: number, l: string) { const c = (answers[qId] || "").split(",").filter(Boolean); const i = c.indexOf(l); i >= 0 ? c.splice(i, 1) : c.push(l); ans(qId, c.join(",")); }

  if (!session) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (session.status !== "IN_PROGRESS") return <div className="min-h-screen flex items-center justify-center"><div className="bg-white rounded-2xl shadow-sm border p-10 text-slate-500">Exam no longer in progress.</div></div>;

  const q = session.questions[idx];
  const m = isNaN(timeLeft) ? 0 : Math.floor(timeLeft / 60), s = isNaN(timeLeft) ? 0 : timeLeft % 60;
  const answered = Object.values(answers).filter(v => v?.length).length;

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="text-sm font-bold text-slate-800">{session.paperTitle}</h1>
          <p className="text-xs text-slate-400">{session.totalQuestions} questions &middot; {session.totalScore} pts</p>
        </div>
        <div className={`text-2xl font-mono font-bold tabular-nums ${timeLeft < 300 ? "text-red-500" : "text-slate-700"}`}>
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </div>
        <button onClick={() => { if (confirm(`${session.totalQuestions - answered} unanswered. Submit?`)) submit(); }} disabled={submitting}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit Exam"}
        </button>
      </div>

      <div className="flex flex-1">
        <aside className="w-56 bg-white/40 border-r border-slate-100 p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Questions</p>
          {session.questions.map((eq, i) => {
            const a = answers[eq.id]?.length > 0;
            return (
              <button key={eq.id} onClick={() => setIdx(i)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  i === idx ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" :
                  a ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:bg-white/60"
                }`}>
                {eq.orderNum}. {a && <span className="text-emerald-500 mr-1">&#10003;</span>}
                {eq.type === "FILL" ? "Fill" : eq.type === "MULTIPLE" ? "Multi" : eq.type === "TRUEFALSE" ? "T/F" : "Choice"}
              </button>
            );
          })}
        </aside>

        <div className="flex-1 p-10 flex flex-col">
          <div className="flex-1 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                q.type === "SINGLE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                q.type === "MULTIPLE" ? "bg-purple-50 text-purple-700 border-purple-200" :
                q.type === "TRUEFALSE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                "bg-amber-50 text-amber-700 border-amber-200"
              }`}>{q.type}</span>
              <span className="text-xs text-slate-400">{q.score} points</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 leading-relaxed mb-8">{q.orderNum}. {q.content}</h2>

            {(q.type === "SINGLE" || q.type === "TRUEFALSE") && (
              <div className="space-y-2.5">
                {q.options.map(o => (
                  <label key={o.label} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === o.label ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300"}`}>
                    <input type="radio" name={`q${q.id}`} checked={answers[q.id] === o.label} onChange={() => ans(q.id, o.label)} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-400 w-6">{o.label}.</span>
                    <span className="text-sm text-slate-700">{o.content}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "MULTIPLE" && (
              <div className="space-y-2.5">
                {q.options.map(o => (
                  <label key={o.label} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${(answers[q.id] || "").split(",").includes(o.label) ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300"}`}>
                    <input type="checkbox" checked={(answers[q.id] || "").split(",").includes(o.label)} onChange={() => toggle(q.id, o.label)} className="text-indigo-600 rounded" />
                    <span className="text-sm font-semibold text-slate-400 w-6">{o.label}.</span>
                    <span className="text-sm text-slate-700">{o.content}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "FILL" && (
              <input value={answers[q.id] || ""} onChange={e => ans(q.id, e.target.value)} placeholder="Type your answer..." className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
            )}
          </div>

          <div className="flex items-center justify-between max-w-3xl mx-auto w-full mt-8 pt-6 border-t border-slate-200">
            <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white/60 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-30 transition-all">Previous</button>
            <span className="text-sm text-slate-400 tabular-nums">{idx + 1} of {session.totalQuestions}</span>
            <button onClick={() => setIdx(Math.min(session.totalQuestions - 1, idx + 1))} disabled={idx === session.totalQuestions - 1}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white/60 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-30 transition-all">Next</button>
          </div>
        </div>
      </div>
    </main>
  );
}

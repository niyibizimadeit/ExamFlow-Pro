"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";

interface Option { label: string; content: string; }
interface ExamQuestion { id: number; content: string; type: string; orderNum: number; score: number; options: Option[]; savedAnswer: string; }
interface SessionData { id: number; paperTitle: string; durationMins: number; totalScore: number; status: string; startTime: string; answeredCount: number; totalQuestions: number; questions: ExamQuestion[]; }

export default function ExamPage() {
  const router = useRouter();
  const { paperId } = useParams<{ paperId: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Init
  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }

    // Check for existing session or start new
    api.get(`/api/scores/my`).then(r => {
      const scores = r.data.data;
      const existing = scores.find((s: Record<string, unknown>) => s.paperId === parseInt(paperId));
      if (existing) {
        alert("You have already completed this exam.");
        router.push("/student/dashboard");
        return;
      }
      startExam();
    }).catch(() => startExam());
  }, []);

  function startExam() {
    api.post(`/api/sessions/start/${paperId}`).then(r => {
      const s = r.data.data;
      setSession(s);
      // Pre-fill answers from saved session
      const ans: Record<number, string> = {};
      s.questions.forEach((q: ExamQuestion) => { if (q.savedAnswer) ans[q.id] = q.savedAnswer; });
      setAnswers(ans);
      const endTime = new Date(s.startTime).getTime() + s.durationMins * 60000;
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }).catch((err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cannot start exam";
      alert(msg);
      router.push("/student/dashboard");
    });
  }

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft > 0]);

  // Auto-submit on timer expire
  useEffect(() => {
    if (timeLeft === 0 && session && session.status === "IN_PROGRESS") {
      handleSubmit();
    }
  }, [timeLeft]);

  // Auto-save every 30s
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => {
      if (Object.keys(answersRef.current).length > 0 && session.status === "IN_PROGRESS") {
        api.put(`/api/sessions/${session.id}/answers`, { answers: answersRef.current }).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(t);
  }, [session]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Final save
      await api.put(`/api/sessions/${session!.id}/answers`, { answers: answersRef.current });
      await api.post(`/api/sessions/${session!.id}/submit`);
      router.push("/student/dashboard");
    } catch {
      setSubmitting(false);
    }
  }

  function setAnswer(qId: number, val: string) {
    setAnswers(prev => ({ ...prev, [qId]: val }));
    answersRef.current = { ...answersRef.current, [qId]: val };
  }

  function toggleMultiple(qId: number, label: string) {
    const cur = (answers[qId] || "").split(",").filter(Boolean);
    const idx = cur.indexOf(label);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.push(label);
    setAnswer(qId, cur.join(","));
  }

  if (!session) return <div className="p-8 text-center text-gray-500">Loading exam…</div>;
  if (session.status !== "IN_PROGRESS") {
    return <div className="p-8 text-center text-gray-500">This exam is no longer in progress.</div>;
  }

  const q = session.questions[currentIdx];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answeredCount = Object.values(answers).filter(v => v && v.length > 0).length;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">{session.paperTitle}</h1>
          <p className="text-xs text-gray-400">{session.totalQuestions} questions · {session.totalScore} pts</p>
        </div>
        <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? "text-red-600 animate-pulse" : "text-blue-600"}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
        <button onClick={() => { if (confirm(`${session.totalQuestions - answeredCount} unanswered. Submit anyway?`)) handleSubmit(); }} disabled={submitting} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
          {submitting ? "Submitting…" : "Submit Exam"}
        </button>
      </div>

      <div className="flex flex-1">
        {/* Question navigator */}
        <aside className="w-56 bg-white border-r p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Questions</p>
          {session.questions.map((eq, i) => {
            const answered = answers[eq.id] && answers[eq.id].length > 0;
            return (
              <button key={eq.id} onClick={() => setCurrentIdx(i)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${i === currentIdx ? "bg-blue-100 text-blue-700 font-semibold" : answered ? "bg-green-50 text-gray-700" : "text-gray-400 hover:bg-gray-50"}`}>
                {eq.orderNum}. {answered ? "✓ " : ""}{eq.type === "FILL" ? "Fill" : eq.type === "MULTIPLE" ? "Multi" : eq.type === "TRUEFALSE" ? "T/F" : "Single"}
              </button>
            );
          })}
        </aside>

        {/* Question area */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="flex-1 max-w-3xl mx-auto w-full">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{q.type}</span>
              <span className="text-xs text-gray-400">{q.score} pts</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-6">{q.orderNum}. {q.content}</h2>

            {/* SINGLE / TRUEFALSE */}
            {(q.type === "SINGLE" || q.type === "TRUEFALSE") && (
              <div className="space-y-2">
                {q.options.map(opt => (
                  <label key={opt.label} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${answers[q.id] === opt.label ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt.label} onChange={() => setAnswer(q.id, opt.label)} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-500">{opt.label}.</span>
                    <span className="text-sm text-gray-800">{opt.content}</span>
                  </label>
                ))}
              </div>
            )}

            {/* MULTIPLE */}
            {q.type === "MULTIPLE" && (
              <div className="space-y-2">
                {q.options.map(opt => (
                  <label key={opt.label} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${(answers[q.id] || "").split(",").includes(opt.label) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="checkbox" checked={(answers[q.id] || "").split(",").includes(opt.label)} onChange={() => toggleMultiple(q.id, opt.label)} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-500">{opt.label}.</span>
                    <span className="text-sm text-gray-800">{opt.content}</span>
                  </label>
                ))}
              </div>
            )}

            {/* FILL */}
            {q.type === "FILL" && (
              <input value={answers[q.id] || ""} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Type your answer…" className="border rounded-lg px-4 py-3 text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>

          {/* Nav buttons */}
          <div className="flex justify-between max-w-3xl mx-auto w-full mt-6 pt-4 border-t">
            <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-30 transition">← Previous</button>
            <span className="text-sm text-gray-400">{currentIdx + 1} / {session.totalQuestions}</span>
            <button onClick={() => setCurrentIdx(Math.min(session.totalQuestions - 1, currentIdx + 1))} disabled={currentIdx === session.totalQuestions - 1} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-30 transition">Next →</button>
          </div>
        </div>
      </div>
    </main>
  );
}

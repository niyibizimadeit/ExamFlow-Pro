"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";

type Question = {
  id: number; content: string; type: string; orderNum: number;
  score: number; options: { label: string; content: string }[]; savedAnswer: string;
};
type Session = {
  id: number; paperTitle: string; durationMins: number; totalScore: number;
  status: string; startTime: string; answeredCount: number; totalQuestions: number;
  questions: Question[];
};

export default function ExamPage() {
  const router = useRouter();
  const { paperId } = useParams<{ paperId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef(answers);
  ref.current = answers;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const p = decodeToken(token);
    if (!p || p.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    api.get("/api/scores/my").then(r => {
      if ((r.data.data || []).find((s: Record<string, unknown>) => s.paperId === parseInt(paperId))) {
        alert("Exam already completed."); router.push("/student/dashboard"); return;
      }
      api.post(`/api/sessions/start/${paperId}`).then(r2 => {
        const s = r2.data.data; setSession(s);
        const a: Record<number, string> = {};
        s.questions.forEach((q: Question) => { if (q.savedAnswer) a[q.id] = q.savedAnswer; });
        setAnswers(a);
        setTimeLeft(Math.max(0, Math.floor((new Date(s.startTime).getTime() + s.durationMins * 60000 - Date.now()) / 1000)));
      }).catch((err: unknown) => { alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error"); router.push("/student/dashboard"); });
    }).catch(() => { alert("Failed to load exam."); router.push("/student/dashboard"); });
  }, []);

  useEffect(() => { if (timeLeft <= 0) return; const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000); return () => clearInterval(t); }, [timeLeft]);
  useEffect(() => { if (timeLeft === 0 && sessionRef.current?.status === "IN_PROGRESS") submit(); }, [timeLeft]);
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => {
      if (Object.keys(ref.current).length && sessionRef.current?.status === "IN_PROGRESS")
        api.put(`/api/sessions/${sessionRef.current!.id}/answers`, { answers: ref.current }).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [session]);

  async function submit() {
    if (submitting) return; setSubmitting(true);
    try {
      await api.put(`/api/sessions/${session!.id}/answers`, { answers: ref.current });
      await api.post(`/api/sessions/${session!.id}/submit`);
      router.push("/student/dashboard");
    } catch { setSubmitting(false); }
  }

  function ans(qId: number, v: string) { setAnswers(p => ({ ...p, [qId]: v })); ref.current = { ...ref.current, [qId]: v }; }
  function toggle(qId: number, l: string) {
    const c = (answers[qId] || "").split(",").filter(Boolean);
    const i = c.indexOf(l); i >= 0 ? c.splice(i, 1) : c.push(l);
    ans(qId, c.join(","));
  }

  if (!session) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-300)" }}>
      Loading…
    </div>
  );
  if (session.status !== "IN_PROGRESS") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ padding: "2.5rem", color: "var(--ink-500)" }}>Exam no longer in progress.</div>
    </div>
  );

  const q = session.questions[idx];
  const mins = isNaN(timeLeft) ? 0 : Math.floor(timeLeft / 60);
  const secs = isNaN(timeLeft) ? 0 : timeLeft % 60;
  const answered = Object.values(answers).filter(v => v?.length).length;
  const urgent = timeLeft < 300 && timeLeft > 0;

  const typeBadgeStyle = (type: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      SINGLE:    { background: "rgba(181,115,42,0.10)", color: "var(--amber-accent)", border: "1px solid rgba(181,115,42,0.25)" },
      MULTIPLE:  { background: "rgba(168,84,56,0.10)", color: "var(--terracotta)",   border: "1px solid rgba(168,84,56,0.22)" },
      TRUEFALSE: { background: "rgba(134,168,102,0.12)", color: "#4a6e30",           border: "1px solid rgba(134,168,102,0.30)" },
      FILL:      { background: "rgba(212,180,131,0.20)", color: "var(--ink-500)",    border: "1px solid rgba(212,180,131,0.40)" },
    };
    return map[type] || map.FILL;
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--parchment-100)" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0.875rem 1.5rem",
        background: "rgba(249,242,227,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(212,180,131,0.35)",
        boxShadow: "0 1px 12px rgba(28,22,18,0.05)",
      }}>
        <div>
          <h1 className="font-display" style={{ fontSize: "1.125rem", fontWeight: 400, color: "var(--ink-900)", margin: 0 }}>
            {session.paperTitle}
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginTop: "0.1rem" }}>
            {session.totalQuestions} questions &middot; {session.totalScore} pts
          </p>
        </div>

        <div style={{
          fontSize: "1.75rem", fontWeight: 300, fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums",
          color: urgent ? "var(--terracotta)" : "var(--ink-700)",
          transition: "color 0.3s ease",
        }}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>

        <button
          onClick={() => { if (confirm(`${session.totalQuestions - answered} unanswered. Submit?`)) submit(); }}
          disabled={submitting}
          style={{
            padding: "0.625rem 1.25rem", borderRadius: "10px", border: "none", cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "0.875rem", fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
            color: "#fdf8f0", opacity: submitting ? 0.55 : 1,
            background: "linear-gradient(135deg, var(--amber-accent), #7a3318)",
            boxShadow: "0 2px 10px rgba(181,115,42,0.28)",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {submitting ? "Submitting…" : "Submit Exam"}
        </button>
      </div>

      <div style={{ display: "flex", flex: 1 }}>

        {/* Sidebar */}
        <aside style={{
          width: "13rem", flexShrink: 0, padding: "1.25rem 0.75rem",
          borderRight: "1px solid rgba(212,180,131,0.25)",
          background: "rgba(253,250,244,0.5)",
          display: "flex", flexDirection: "column", gap: "0.25rem",
        }}>
          <p className="section-label" style={{ padding: "0 0.5rem", marginBottom: "0.75rem" }}>Questions</p>
          {session.questions.map((eq, i) => {
            const isActive = i === idx;
            const isDone = answers[eq.id]?.length > 0;
            return (
              <button
                key={eq.id}
                onClick={() => setIdx(i)}
                style={{
                  width: "100%", textAlign: "left", padding: "0.5rem 0.75rem",
                  borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "0.8125rem", fontFamily: "'DM Sans', sans-serif",
                  fontWeight: isActive ? 500 : 400,
                  transition: "all 0.12s ease",
                  background: isActive
                    ? "linear-gradient(135deg, var(--amber-accent), #7a3318)"
                    : isDone
                    ? "rgba(134,168,102,0.12)"
                    : "transparent",
                  color: isActive ? "#fdf8f0" : isDone ? "#4a6e30" : "var(--ink-400, #b8a18a)",
                  boxShadow: isActive ? "0 2px 8px rgba(181,115,42,0.22)" : "none",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(212,180,131,0.15)"; }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = isDone ? "rgba(134,168,102,0.12)" : "transparent";
                }}
              >
                {eq.orderNum}.{" "}
                {isDone && !isActive && <span style={{ color: "#4a6e30", marginRight: "0.2rem" }}>✓</span>}
                {eq.type === "FILL" ? "Fill" : eq.type === "MULTIPLE" ? "Multi" : eq.type === "TRUEFALSE" ? "T/F" : "Choice"}
              </button>
            );
          })}
        </aside>

        {/* Question area */}
        <div style={{ flex: 1, padding: "2.5rem 3rem", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, maxWidth: "42rem", margin: "0 auto", width: "100%" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <span style={{
                fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.625rem",
                borderRadius: "9999px", fontFamily: "'DM Sans', sans-serif",
                ...typeBadgeStyle(q.type),
              }}>
                {q.type}
              </span>
              <span style={{ fontSize: "0.8125rem", color: "var(--ink-300)" }}>{q.score} points</span>
            </div>

            <h2 className="font-display" style={{
              fontSize: "1.4rem", fontWeight: 400, lineHeight: 1.5,
              color: "var(--ink-900)", marginBottom: "2rem",
            }}>
              {q.orderNum}. {q.content}
            </h2>

            {(q.type === "SINGLE" || q.type === "TRUEFALSE") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {q.options.map(o => {
                  const selected = answers[q.id] === o.label;
                  return (
                    <label
                      key={o.label}
                      style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "1rem 1.125rem", borderRadius: "10px", cursor: "pointer",
                        border: selected ? "1.5px solid rgba(181,115,42,0.5)" : "1.5px solid rgba(212,180,131,0.35)",
                        background: selected ? "rgba(181,115,42,0.07)" : "rgba(253,250,244,0.6)",
                        transition: "all 0.12s ease",
                      }}
                    >
                      <input type="radio" name={`q${q.id}`} checked={selected} onChange={() => ans(q.id, o.label)}
                        style={{ accentColor: "var(--amber-accent)", width: "1rem", height: "1rem" }} />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink-300)", width: "1.5rem" }}>{o.label}.</span>
                      <span style={{ fontSize: "0.9375rem", color: "var(--ink-700)" }}>{o.content}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === "MULTIPLE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {q.options.map(o => {
                  const checked = (answers[q.id] || "").split(",").includes(o.label);
                  return (
                    <label
                      key={o.label}
                      style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "1rem 1.125rem", borderRadius: "10px", cursor: "pointer",
                        border: checked ? "1.5px solid rgba(181,115,42,0.5)" : "1.5px solid rgba(212,180,131,0.35)",
                        background: checked ? "rgba(181,115,42,0.07)" : "rgba(253,250,244,0.6)",
                        transition: "all 0.12s ease",
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggle(q.id, o.label)}
                        style={{ accentColor: "var(--amber-accent)", width: "1rem", height: "1rem" }} />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink-300)", width: "1.5rem" }}>{o.label}.</span>
                      <span style={{ fontSize: "0.9375rem", color: "var(--ink-700)" }}>{o.content}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === "FILL" && (
              <input
                value={answers[q.id] || ""}
                onChange={e => ans(q.id, e.target.value)}
                placeholder="Type your answer…"
                style={{
                  width: "100%", maxWidth: "28rem", padding: "0.875rem 1rem",
                  fontSize: "0.9375rem", borderRadius: "10px", outline: "none",
                  border: "1.5px solid rgba(212,180,131,0.5)",
                  background: "rgba(253,250,244,0.7)", color: "var(--ink-900)",
                  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--amber-accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,115,42,0.12)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(212,180,131,0.5)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            )}
          </div>

          {/* Prev / Next */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            maxWidth: "42rem", margin: "2rem auto 0", width: "100%",
            paddingTop: "1.5rem", borderTop: "1px solid rgba(212,180,131,0.25)",
          }}>
            {[
              { label: "Previous", action: () => setIdx(Math.max(0, idx - 1)), disabled: idx === 0 },
              { label: "Next",     action: () => setIdx(Math.min(session.totalQuestions - 1, idx + 1)), disabled: idx === session.totalQuestions - 1 },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                disabled={btn.disabled}
                style={{
                  padding: "0.625rem 1.25rem", borderRadius: "8px", fontSize: "0.875rem",
                  fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: btn.disabled ? "not-allowed" : "pointer",
                  opacity: btn.disabled ? 0.3 : 1, transition: "all 0.12s ease",
                  border: "1.5px solid rgba(212,180,131,0.4)",
                  background: "rgba(253,250,244,0.7)", color: "var(--ink-700)",
                }}
                onMouseEnter={e => { if (!btn.disabled) e.currentTarget.style.background = "rgba(212,180,131,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(253,250,244,0.7)"; }}
              >
                {btn.label}
              </button>
            ))}
            <span style={{ fontSize: "0.875rem", color: "var(--ink-300)" }}>
              {idx + 1} of {session.totalQuestions}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

type Answer = {
  questionId: number; questionContent: string; questionType: string;
  answerGiven: string; correctAnswer: string; isCorrect: boolean;
  scoreEarned: number; maxScore: number; explanation: string;
};
type Detail = {
  id: number; sessionId: number; paperTitle: string; score: number;
  totalScore: number; passed: boolean; gradedAt: string; answers: Answer[];
};

export default function ResultDetailPage() {
  const router = useRouter();
  const { scoreId } = useParams<{ scoreId: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/scores/my").then(r => {
      const score = (r.data.data || []).find((s: Record<string, unknown>) => s.id === parseInt(scoreId));
      if (score?.sessionId)
        api.get(`/api/scores/detail/${score.sessionId}`).then(r2 => setDetail(r2.data.data)).catch(() => {});
    }).catch(() => {});
  }, [router, scoreId]);

  if (!user || !detail) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-300)" }}>
      Loading…
    </div>
  );

  const pct = detail.totalScore > 0 ? Math.round((detail.score / detail.totalScore) * 100) : 0;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main style={{ padding: "2.5rem 2rem", maxWidth: "48rem", margin: "0 auto" }} className="animate-fade-in">

        <Link href="/student/dashboard" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
          ← Back to Dashboard
        </Link>

        {/* Score summary card */}
        <div className="card animate-slide-up" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 300, color: "var(--ink-900)", marginBottom: "1rem" }}>
            {detail.paperTitle}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <span className="font-display" style={{ fontSize: "2.75rem", fontWeight: 300, color: "var(--ink-900)", lineHeight: 1 }}>
              {detail.score}
              <span style={{ fontSize: "1.25rem", color: "var(--ink-300)", fontWeight: 300 }}>/{detail.totalScore}</span>
            </span>
            <span style={{
              fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem",
              borderRadius: "9999px", fontFamily: "'DM Sans', sans-serif",
              ...(detail.passed
                ? { background: "rgba(134,168,102,0.12)", color: "#4a6e30", border: "1px solid rgba(134,168,102,0.30)" }
                : { background: "rgba(168,84,56,0.10)", color: "var(--terracotta)", border: "1px solid rgba(168,84,56,0.22)" }),
            }}>
              {detail.passed ? "Passed" : "Failed"}
            </span>
          </div>
          <div style={{ height: "6px", background: "rgba(212,180,131,0.25)", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`, borderRadius: "9999px",
              background: detail.passed
                ? "linear-gradient(90deg, #86a866, #4a6e30)"
                : "linear-gradient(90deg, var(--parchment-400), var(--terracotta))",
              transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--ink-300)", marginTop: "0.5rem" }}>{pct}%</p>
        </div>

        <p className="section-label" style={{ marginBottom: "1rem" }}>Question Breakdown</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {detail.answers.map((a, i) => (
            <div
              key={a.questionId}
              className="card animate-slide-up"
              style={{
                padding: "1.25rem 1.375rem",
                animationDelay: `${i * 40}ms`,
                borderLeft: `3px solid ${a.isCorrect ? "#86a866" : "var(--terracotta)"}`,
                borderRadius: "10px 14px 14px 10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                <p style={{ fontSize: "0.9375rem", color: "var(--ink-800, #2a2018)", flex: 1, paddingRight: "1rem", lineHeight: 1.5 }}>
                  {i + 1}. {a.questionContent}
                </p>
                <span style={{
                  fontSize: "0.8125rem", fontWeight: 600, flexShrink: 0,
                  color: a.isCorrect ? "#4a6e30" : "var(--terracotta)",
                }}>
                  {a.scoreEarned}/{a.maxScore}
                </span>
              </div>

              <div style={{
                display: "grid", gridTemplateColumns: a.isCorrect ? "1fr" : "1fr 1fr",
                gap: "0.5rem", fontSize: "0.8125rem",
                background: "rgba(212,180,131,0.08)", borderRadius: "8px", padding: "0.75rem",
              }}>
                <div>
                  <span style={{ color: "var(--ink-300)" }}>Your answer: </span>
                  <span style={{ fontWeight: 500, color: a.isCorrect ? "#4a6e30" : "var(--terracotta)" }}>
                    {a.answerGiven || "(unanswered)"}
                  </span>
                </div>
                {!a.isCorrect && (
                  <div>
                    <span style={{ color: "var(--ink-300)" }}>Correct: </span>
                    <span style={{ fontWeight: 500, color: "#4a6e30" }}>{a.correctAnswer}</span>
                  </div>
                )}
              </div>

              {a.explanation && (
                <details style={{ marginTop: "0.875rem" }}>
                  <summary style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--amber-accent)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Explanation
                  </summary>
                  <p style={{
                    fontSize: "0.8125rem", color: "var(--ink-500)", marginTop: "0.5rem",
                    padding: "0.75rem", background: "rgba(181,115,42,0.06)",
                    borderRadius: "8px", lineHeight: 1.6,
                  }}>
                    {a.explanation}
                  </p>
                </details>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
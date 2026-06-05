"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

type WrongAnswer = {
  questionId: number;
  questionContent: string;
  questionType: string;
  answerGiven: string;
  correctAnswer: string;
  scoreEarned: number;
  maxScore: number;
  explanation: string;
  paperId?: number;
  paperTitle?: string;
  sessionId?: number;
  categoryId?: number;
  categoryName?: string;
  difficulty?: number;
};

const difficultyStars = (d?: number) =>
  d ? "⭐".repeat(d) : "";

const typeBadgeColor = (t: string) => {
  switch (t) {
    case "SINGLE":    return { bg: "rgba(59,130,246,0.10)", color: "#2563eb", border: "rgba(59,130,246,0.25)" };
    case "MULTIPLE":  return { bg: "rgba(147,51,234,0.10)", color: "#7c3aed", border: "rgba(147,51,234,0.25)" };
    case "TRUEFALSE": return { bg: "rgba(16,185,129,0.10)", color: "#059669", border: "rgba(16,185,129,0.25)" };
    case "FILL":      return { bg: "rgba(249,115,22,0.10)", color: "#ea580c", border: "rgba(249,115,22,0.25)" };
    default:          return { bg: "rgba(212,180,131,0.10)", color: "var(--ink-500)", border: "rgba(212,180,131,0.25)" };
  }
};

export default function WrongAnswersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [allWrong, setAllWrong] = useState<WrongAnswer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterPaper, setFilterPaper] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    fetchWrongAnswers();
  }, [router]);

  const fetchWrongAnswers = (type = "", paperId = "") => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (paperId) params.paperId = paperId;
    api.get("/api/scores/wrong/all", { params })
      .then(r => {
        const data = r.data.data;
        if (data && Array.isArray(data.answers)) {
          setAllWrong(data.answers);
          setTotalCount(data.totalCount ?? data.answers.length);
        } else if (Array.isArray(data)) {
          // fallback for old API format
          setAllWrong(data);
          setTotalCount(data.length);
        }
      })
      .catch(() => { setAllWrong([]); setTotalCount(0); })
      .finally(() => setLoading(false));
  };

  // Derive available papers from data
  const paperOptions = useMemo(() => {
    const seen = new Map<number, string>();
    allWrong.forEach(a => {
      if (a.paperId && !seen.has(a.paperId)) seen.set(a.paperId, a.paperTitle || `Paper #${a.paperId}`);
    });
    return Array.from(seen.entries());
  }, [allWrong]);

  // Group by paper for the grouped view
  const groupedByPaper = useMemo(() => {
    const groups: Record<string, WrongAnswer[]> = {};
    allWrong.forEach(a => {
      const key = a.paperTitle || "Unknown Paper";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return groups;
  }, [allWrong]);

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main
        className="px-6 py-10 max-w-4xl mx-auto animate-fade-in"
        style={{ paddingBottom: "4rem" }}
      >

        {/* ── Header ── */}
        <div className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em] mb-2"
            style={{ color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Review & Improve
          </p>
          <h1 className="font-display text-4xl font-light tracking-tight" style={{ color: "var(--ink-900)", lineHeight: 1.15 }}>
            Wrong Answer Notebook
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--ink-300)" }}>
            {loading ? "Loading..." : `${totalCount} question${totalCount !== 1 ? "s" : ""} to review`}
          </p>
        </div>

        {/* ── Filters ── */}
        {!loading && totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); fetchWrongAnswers(e.target.value, filterPaper); }}
              className="select-glass text-xs"
              style={{ width: "auto", paddingRight: "2rem" }}
            >
              <option value="">All types</option>
              <option value="SINGLE">Single Choice</option>
              <option value="MULTIPLE">Multiple Choice</option>
              <option value="TRUEFALSE">True/False</option>
              <option value="FILL">Fill-in</option>
            </select>
            {paperOptions.length > 0 && (
              <select
                value={filterPaper}
                onChange={e => { setFilterPaper(e.target.value); fetchWrongAnswers(filterType, e.target.value); }}
                className="select-glass text-xs"
                style={{ width: "auto", paddingRight: "2rem" }}
              >
                <option value="">All papers</option>
                {paperOptions.map(([id, title]) => (
                  <option key={id} value={id}>{title}</option>
                ))}
              </select>
            )}
            <Link
              href="/student/dashboard"
              className="btn-ghost text-xs ml-auto"
              style={{ color: "var(--amber-accent)" }}
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && totalCount === 0 && (
          <div className="card" style={{ padding: "4rem", textAlign: "center" }}>
            <div style={{
              width: "4rem", height: "4rem", borderRadius: "9999px",
              background: "rgba(134,168,102,0.12)", display: "flex",
              alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
            }}>
              <svg width="28" height="28" fill="none" stroke="#4a6e30" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-display" style={{ fontSize: "1.25rem", fontWeight: 400, color: "var(--ink-700)", marginBottom: "0.375rem" }}>
              All clear
            </p>
            <p className="text-sm" style={{ color: "var(--ink-300)", marginBottom: "1.5rem" }}>
              No wrong answers to review — great job!
            </p>
            <Link href="/student/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card animate-pulse" style={{ padding: "1.25rem 1.375rem" }}>
                <div className="flex justify-between mb-3">
                  <div className="h-3 w-16 rounded-md" style={{ background: "var(--ink-100)" }} />
                  <div className="h-3 w-12 rounded-md" style={{ background: "var(--ink-100)" }} />
                </div>
                <div className="h-5 w-3/4 rounded-md mb-3" style={{ background: "rgba(212,180,131,0.2)" }} />
                <div className="h-12 rounded-lg" style={{ background: "rgba(212,180,131,0.12)" }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Grouped by paper ── */}
        {!loading && totalCount > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {Object.entries(groupedByPaper).map(([paperTitle, items]) => (
              <section key={paperTitle}>
                {/* Paper group header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(168,84,56,0.15) 0%, rgba(168,84,56,0.08) 100%)",
                      boxShadow: "0 1px 4px rgba(168,84,56,0.10), inset 0 1px 0 rgba(255,255,255,0.4)",
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}
                      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                      style={{ color: "var(--terracotta)" }}
                    >
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--ink-700)" }}>
                    {paperTitle}
                  </p>
                  <span className="text-xs" style={{ color: "var(--ink-300)" }}>
                    {items.length} wrong
                  </span>
                </div>

                {/* Question cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {items.map((a, i) => {
                    const badge = typeBadgeColor(a.questionType);
                    return (
                      <div
                        key={`${a.questionId}-${a.sessionId || i}`}
                        className="card animate-slide-up"
                        style={{
                          padding: "1.25rem 1.375rem",
                          animationDelay: `${i * 35}ms`,
                          borderLeft: "3px solid var(--terracotta)",
                          borderRadius: "10px 14px 14px 10px",
                        }}
                      >
                        {/* Top row: type badge + difficulty + score */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase",
                            letterSpacing: "0.10em", fontFamily: "'DM Sans', sans-serif",
                            padding: "0.15rem 0.5rem", borderRadius: "5px",
                            background: badge.bg, color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}>
                            {a.questionType}
                          </span>
                          {a.difficulty && (
                            <span style={{ fontSize: "0.75rem" }} title={`Difficulty: ${a.difficulty}`}>
                              {difficultyStars(a.difficulty)}
                            </span>
                          )}
                          {a.categoryName && (
                            <span className="text-xs" style={{ color: "var(--ink-300)", fontStyle: "italic" }}>
                              {a.categoryName}
                            </span>
                          )}
                          <span style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginLeft: "auto" }}>
                            {a.scoreEarned}/{a.maxScore} pts
                          </span>
                        </div>

                        {/* Question content */}
                        <p style={{ fontSize: "0.9375rem", color: "var(--ink-900)", marginBottom: "0.875rem", lineHeight: 1.5 }}>
                          {a.questionContent}
                        </p>

                        {/* Answer comparison */}
                        <div style={{
                          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem",
                          fontSize: "0.8125rem", background: "rgba(212,180,131,0.08)",
                          borderRadius: "8px", padding: "0.75rem",
                        }}>
                          <div>
                            <span style={{ color: "var(--ink-300)" }}>Your answer: </span>
                            <span style={{ fontWeight: 500, color: "var(--terracotta)" }}>
                              {a.answerGiven || "(unanswered)"}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "var(--ink-300)" }}>Correct: </span>
                            <span style={{ fontWeight: 500, color: "#4a6e30" }}>{a.correctAnswer}</span>
                          </div>
                        </div>

                        {/* Explanation */}
                        {a.explanation && (
                          <details style={{ marginTop: "0.875rem" }}>
                            <summary style={{
                              fontSize: "0.8125rem", fontWeight: 500, color: "var(--amber-accent)",
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            }}>
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

                        {/* Link to full result */}
                        {a.sessionId && (
                          <div style={{ marginTop: "0.75rem" }}>
                            <Link
                              href={`/student/results/${a.sessionId}`}
                              className="text-xs font-medium"
                              style={{ color: "var(--amber-accent)" }}
                            >
                              View full result →
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
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

/* ── Inline SVG icons ── */

const IconXCircle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6m0-6l6 6" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

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
          setAllWrong(data);
          setTotalCount(data.length);
        }
      })
      .catch(() => { setAllWrong([]); setTotalCount(0); })
      .finally(() => setLoading(false));
  };

  const paperOptions = useMemo(() => {
    const seen = new Map<number, string>();
    allWrong.forEach(a => {
      if (a.paperId && !seen.has(a.paperId)) seen.set(a.paperId, a.paperTitle || `Paper #${a.paperId}`);
    });
    return Array.from(seen.entries());
  }, [allWrong]);

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

        {/* ── Page header ── */}
        <div className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em] mb-2"
            style={{ color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Review &amp; Improve
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(168,84,56,0.22) 0%, rgba(181,115,42,0.12) 100%)",
                boxShadow: "0 1px 4px rgba(168,84,56,0.14), inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            >
              <span style={{ color: "var(--terracotta)" }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.5}
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
            </div>
            <div>
              <h1
                className="font-display text-4xl font-light tracking-tight"
                style={{ color: "var(--ink-900)", lineHeight: 1.15 }}
              >
                Wrong Answer Notebook
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--ink-300)" }}>
                {loading ? "Loading..." : `${totalCount} question${totalCount !== 1 ? "s" : ""} to review`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        {!loading && totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-8 animate-slide-up">
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
          <div className="card animate-fade-in" style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{
              width: "3rem", height: "3rem", borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
              background: "linear-gradient(135deg, rgba(134,168,102,0.22) 0%, rgba(74,110,48,0.12) 100%)",
              boxShadow: "0 2px 10px rgba(134,168,102,0.14), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}>
              <span style={{ color: "#4a6e30" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5}
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <h2
              className="font-display text-2xl font-light tracking-tight"
              style={{ color: "var(--ink-700)", marginBottom: "0.5rem" }}
            >
              All clear
            </h2>
            <p className="text-sm" style={{ color: "var(--ink-300)", marginBottom: "1.75rem" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {Object.entries(groupedByPaper).map(([paperTitle, items]) => (
              <section key={paperTitle}>
                {/* Paper group header — icon badge matching dashboard style */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(168,84,56,0.22) 0%, rgba(168,84,56,0.10) 100%)",
                      boxShadow: "0 1px 4px rgba(168,84,56,0.12), inset 0 1px 0 rgba(255,255,255,0.45)",
                    }}
                  >
                    <span style={{ color: "var(--terracotta)" }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={1.5}
                        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--ink-700)" }}>
                      {paperTitle}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-300)" }}>
                      {items.length} wrong answer{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
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
                          padding: "1.375rem 1.5rem",
                          animationDelay: `${i * 35}ms`,
                          borderLeft: "3px solid var(--terracotta)",
                          borderRadius: "10px 14px 14px 10px",
                        }}
                      >
                        {/* Top row: type badge + difficulty + category + score */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: "0.5rem",
                          marginBottom: "0.875rem", flexWrap: "wrap",
                        }}>
                          <span style={{
                            fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase",
                            letterSpacing: "0.10em", fontFamily: "'DM Sans', sans-serif",
                            padding: "0.2rem 0.55rem", borderRadius: "5px",
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
                        <p style={{
                          fontSize: "0.9375rem", color: "var(--ink-900)",
                          marginBottom: "0.875rem", lineHeight: 1.5,
                        }}>
                          {a.questionContent}
                        </p>

                        {/* Your answer vs Correct answer — side by side with icons */}
                        <div style={{
                          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem",
                          fontSize: "0.8125rem",
                        }}>
                          <div style={{
                            background: "rgba(168,84,56,0.06)",
                            borderRadius: "10px", padding: "0.75rem 0.875rem",
                            border: "1px solid rgba(168,84,56,0.15)",
                          }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span style={{ color: "var(--terracotta)" }}><IconXCircle /></span>
                              <span style={{ fontWeight: 600, fontSize: "0.6875rem", color: "var(--terracotta)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Your answer
                              </span>
                            </div>
                            <span style={{ fontWeight: 500, color: "var(--terracotta)", paddingLeft: "0.25rem" }}>
                              {a.answerGiven || "(unanswered)"}
                            </span>
                          </div>
                          <div style={{
                            background: "rgba(134,168,102,0.06)",
                            borderRadius: "10px", padding: "0.75rem 0.875rem",
                            border: "1px solid rgba(134,168,102,0.18)",
                          }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5}
                                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                                style={{ color: "#4a6e30" }}
                              >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span style={{ fontWeight: 600, fontSize: "0.6875rem", color: "#4a6e30", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Correct
                              </span>
                            </div>
                            <span style={{ fontWeight: 500, color: "#4a6e30", paddingLeft: "0.25rem" }}>
                              {a.correctAnswer}
                            </span>
                          </div>
                        </div>

                        {/* Explanation — collapsible with icon */}
                        {a.explanation && (
                          <details style={{ marginTop: "0.875rem" }}>
                            <summary style={{
                              fontSize: "0.8125rem", fontWeight: 500, color: "var(--amber-accent)",
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                              display: "inline-flex", alignItems: "center", gap: "0.375rem",
                            }}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}
                                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                              </svg>
                              Explanation
                            </summary>
                            <p style={{
                              fontSize: "0.8125rem", color: "var(--ink-500)", marginTop: "0.625rem",
                              padding: "0.875rem 1rem", background: "rgba(181,115,42,0.05)",
                              borderRadius: "10px", lineHeight: 1.6, border: "1px solid rgba(212,180,131,0.18)",
                            }}>
                              {a.explanation}
                            </p>
                          </details>
                        )}

                        {/* Link to full result */}
                        {a.sessionId && (
                          <div style={{ marginTop: "0.875rem" }}>
                            <Link
                              href={`/student/results/${a.sessionId}`}
                              className="btn-ghost text-xs inline-flex items-center gap-1"
                              style={{ color: "var(--amber-accent)", padding: "0.25rem 0.5rem" }}
                            >
                              View full result
                              <IconArrowRight />
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

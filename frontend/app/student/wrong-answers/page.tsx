"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

type WrongAnswer = {
  questionId: number; questionContent: string; questionType: string;
  answerGiven: string; correctAnswer: string;
  scoreEarned: number; maxScore: number; explanation: string;
  paperId?: number; paperTitle?: string; sessionId?: number;
  categoryId?: number; categoryName?: string; difficulty?: number;
};

/* ── Icons ── */
const BookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const DocIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6m0-6l6 6" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const stars = (d?: number) => d ? "⭐".repeat(d) : "";

const typeBadge = (t: string) => {
  switch (t) {
    case "SINGLE":    return { bg: "rgba(59,130,246,0.10)",  color: "#2563eb", border: "rgba(59,130,246,0.25)" };
    case "MULTIPLE":  return { bg: "rgba(147,51,234,0.10)",  color: "#7c3aed", border: "rgba(147,51,234,0.25)" };
    case "TRUEFALSE": return { bg: "rgba(16,185,129,0.10)",  color: "#059669", border: "rgba(16,185,129,0.25)" };
    case "FILL":      return { bg: "rgba(249,115,22,0.10)",  color: "#ea580c", border: "rgba(249,115,22,0.25)" };
    default:          return { bg: "rgba(212,180,131,0.10)", color: "var(--ink-500)", border: "rgba(212,180,131,0.25)" };
  }
};

const iconBox = (bg: string, shadow: string, size = "2rem") => ({
  width: size, height: size, borderRadius: "11px", flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: bg, boxShadow: shadow,
} as React.CSSProperties);

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
    allWrong.forEach(a => { if (a.paperId && !seen.has(a.paperId)) seen.set(a.paperId, a.paperTitle || `Paper #${a.paperId}`); });
    return Array.from(seen.entries());
  }, [allWrong]);

  const groupedByPaper = useMemo(() => {
    const groups: Record<string, WrongAnswer[]> = {};
    allWrong.forEach(a => { const k = a.paperTitle || "Unknown Paper"; if (!groups[k]) groups[k] = []; groups[k].push(a); });
    return groups;
  }, [allWrong]);

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "2.5rem 1.5rem 5rem", maxWidth: "56rem", margin: "0 auto" }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: "2.5rem" }}>
          <p style={{
            fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.14em", color: "var(--ink-300)",
            fontFamily: "'DM Sans', sans-serif", marginBottom: "0.375rem",
          }}>Review &amp; Improve</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={iconBox(
              "linear-gradient(135deg, rgba(168,84,56,0.22) 0%, rgba(181,115,42,0.12) 100%)",
              "0 2px 8px rgba(168,84,56,0.12), inset 0 1px 0 rgba(255,255,255,0.45)",
            )}>
              <span style={{ color: "var(--terracotta)", display: "flex" }}><BookIcon /></span>
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: "2.25rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1 }}>
                Wrong Answer Notebook
              </h1>
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-300)", marginTop: "0.25rem" }}>
                {loading ? "Loading…" : `${totalCount} question${totalCount !== 1 ? "s" : ""} to review`}
              </p>
            </div>
          </div>
        </header>

        {/* ── Filters ── */}
        {!loading && totalCount > 0 && (
          <div className="animate-slide-up" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
            <select value={filterType}
              onChange={e => { setFilterType(e.target.value); fetchWrongAnswers(e.target.value, filterPaper); }}
              className="select-glass" style={{ fontSize: "0.75rem", width: "auto", paddingRight: "1.75rem" }}>
              <option value="">All types</option>
              <option value="SINGLE">Single Choice</option>
              <option value="MULTIPLE">Multiple Choice</option>
              <option value="TRUEFALSE">True / False</option>
              <option value="FILL">Fill‑in</option>
            </select>
            {paperOptions.length > 0 && (
              <select value={filterPaper}
                onChange={e => { setFilterPaper(e.target.value); fetchWrongAnswers(filterType, e.target.value); }}
                className="select-glass" style={{ fontSize: "0.75rem", width: "auto", paddingRight: "1.75rem" }}>
                <option value="">All papers</option>
                {paperOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
              </select>
            )}
            <Link href="/student/dashboard" className="btn-ghost"
              style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)", marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              Back to Dashboard <ArrowIcon />
            </Link>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && totalCount === 0 && (
          <div className="card animate-fade-in" style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
            <div style={{
              width: "3.25rem", height: "3.25rem", borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
              background: "linear-gradient(135deg, rgba(134,168,102,0.2) 0%, rgba(74,110,48,0.1) 100%)",
              boxShadow: "0 3px 12px rgba(134,168,102,0.14), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}>
              <span style={{ color: "#4a6e30", display: "flex" }}><CheckCircleIcon /></span>
            </div>
            <h2 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 400, color: "var(--ink-700)", marginBottom: "0.375rem" }}>
              All clear
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-300)", marginBottom: "1.5rem" }}>
              No wrong answers to review — great job!
            </p>
            <Link href="/student/dashboard" className="btn-primary">Back to Dashboard</Link>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card animate-pulse" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ height: "0.75rem", width: "4rem", borderRadius: "6px", background: "var(--ink-100)" }} />
                  <div style={{ height: "0.75rem", width: "3rem", borderRadius: "6px", background: "var(--ink-100)" }} />
                </div>
                <div style={{ height: "1.25rem", width: "75%", borderRadius: "6px", marginBottom: "0.75rem", background: "rgba(212,180,131,0.2)" }} />
                <div style={{ height: "3rem", borderRadius: "10px", background: "rgba(212,180,131,0.12)" }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Grouped by paper ── */}
        {!loading && totalCount > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {Object.entries(groupedByPaper).map(([paperTitle, items]) => (
              <section key={paperTitle}>
                {/* Paper group header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.125rem" }}>
                  <div style={iconBox(
                    "linear-gradient(135deg, rgba(168,84,56,0.2) 0%, rgba(168,84,56,0.09) 100%)",
                    "0 1px 4px rgba(168,84,56,0.10), inset 0 1px 0 rgba(255,255,255,0.45)",
                  )}>
                    <span style={{ color: "var(--terracotta)", display: "flex" }}><DocIcon /></span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--ink-700)", fontFamily: "'DM Sans', sans-serif" }}>
                      {paperTitle}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--ink-300)", marginTop: "0.125rem", fontFamily: "'DM Sans', sans-serif" }}>
                      {items.length} wrong answer{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Question cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {items.map((a, i) => {
                    const badge = typeBadge(a.questionType);
                    return (
                      <div key={`${a.questionId}-${a.sessionId || i}`}
                        className="card animate-slide-up"
                        style={{ padding: "1.125rem 1.25rem", animationDelay: `${i * 35}ms`, borderLeft: "3px solid var(--terracotta)", borderRadius: "10px 14px 14px 10px" }}>

                        {/* Top row */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
                            letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif",
                            padding: "0.15rem 0.5rem", borderRadius: "5px",
                            background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                          }}>{a.questionType}</span>
                          {a.difficulty && <span style={{ fontSize: "0.75rem" }} title={`Difficulty ${a.difficulty}`}>{stars(a.difficulty)}</span>}
                          {a.categoryName && <span style={{ fontSize: "0.6875rem", color: "var(--ink-300)", fontStyle: "italic", fontFamily: "'DM Sans', sans-serif" }}>{a.categoryName}</span>}
                          <span style={{ fontSize: "0.6875rem", color: "var(--ink-300)", marginLeft: "auto", fontFamily: "'DM Sans', sans-serif" }}>{a.scoreEarned}/{a.maxScore} pts</span>
                        </div>

                        {/* Question */}
                        <p style={{ fontSize: "0.875rem", color: "var(--ink-900)", marginBottom: "0.75rem", lineHeight: 1.5 }}>{a.questionContent}</p>

                        {/* Answer comparison */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8125rem" }}>
                          <div style={{ background: "rgba(168,84,56,0.05)", borderRadius: "10px", padding: "0.625rem 0.75rem", border: "1px solid rgba(168,84,56,0.12)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
                              <span style={{ color: "var(--terracotta)", display: "flex" }}><XIcon /></span>
                              <span style={{ fontWeight: 600, fontSize: "0.625rem", color: "var(--terracotta)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>Your answer</span>
                            </div>
                            <span style={{ fontWeight: 500, color: "var(--terracotta)", fontSize: "0.8125rem" }}>{a.answerGiven || "(unanswered)"}</span>
                          </div>
                          <div style={{ background: "rgba(134,168,102,0.05)", borderRadius: "10px", padding: "0.625rem 0.75rem", border: "1px solid rgba(134,168,102,0.14)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
                              <span style={{ color: "#4a6e30", display: "flex" }}><CheckCircleIcon /></span>
                              <span style={{ fontWeight: 600, fontSize: "0.625rem", color: "#4a6e30", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>Correct</span>
                            </div>
                            <span style={{ fontWeight: 500, color: "#4a6e30", fontSize: "0.8125rem" }}>{a.correctAnswer}</span>
                          </div>
                        </div>

                        {/* Explanation */}
                        {a.explanation && (
                          <details style={{ marginTop: "0.75rem" }}>
                            <summary style={{
                              fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)",
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                              display: "inline-flex", alignItems: "center", gap: "0.25rem",
                            }}>
                              <InfoIcon /> Explanation
                            </summary>
                            <p style={{
                              fontSize: "0.75rem", color: "var(--ink-500)", marginTop: "0.5rem",
                              padding: "0.75rem 0.875rem", background: "rgba(181,115,42,0.04)",
                              borderRadius: "10px", lineHeight: 1.6, border: "1px solid rgba(212,180,131,0.15)",
                            }}>{a.explanation}</p>
                          </details>
                        )}

                        {/* Result link */}
                        {a.sessionId && (
                          <div style={{ marginTop: "0.75rem" }}>
                            <Link href={`/student/results/${a.sessionId}`} className="btn-ghost"
                              style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem" }}>
                              View full result <ArrowIcon />
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
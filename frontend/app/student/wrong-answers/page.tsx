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
  categoryName?: string; difficulty?: number;
};

const typeBadge = (t: string): React.CSSProperties => {
  const map: Record<string, React.CSSProperties> = {
    SINGLE:    { background: "rgba(59,130,246,0.10)",  color: "#2563eb", border: "1px solid rgba(59,130,246,0.22)" },
    MULTIPLE:  { background: "rgba(147,51,234,0.10)",  color: "#7c3aed", border: "1px solid rgba(147,51,234,0.22)" },
    TRUEFALSE: { background: "rgba(16,185,129,0.10)",  color: "#059669", border: "1px solid rgba(16,185,129,0.22)" },
    FILL:      { background: "rgba(249,115,22,0.10)",  color: "#ea580c", border: "1px solid rgba(249,115,22,0.22)" },
  };
  return map[t] || { background: "rgba(212,180,131,0.10)", color: "var(--ink-500)", border: "1px solid rgba(212,180,131,0.25)" };
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
    load("", "");
  }, [router]);

  function load(type: string, paperId: string) {
    setLoading(true);
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (paperId) params.paperId = paperId;
    api.get("/api/scores/wrong/all", { params })
      .then(r => {
        const data = r.data.data;
        if (data && Array.isArray(data.answers)) { setAllWrong(data.answers); setTotalCount(data.totalCount ?? data.answers.length); }
        else if (Array.isArray(data)) { setAllWrong(data); setTotalCount(data.length); }
      })
      .catch(() => { setAllWrong([]); setTotalCount(0); })
      .finally(() => setLoading(false));
  }

  const paperOptions = useMemo(() => {
    const seen = new Map<number, string>();
    allWrong.forEach(a => { if (a.paperId && !seen.has(a.paperId)) seen.set(a.paperId, a.paperTitle || `Paper #${a.paperId}`); });
    return Array.from(seen.entries());
  }, [allWrong]);

  const grouped = useMemo(() => {
    const g: Record<string, WrongAnswer[]> = {};
    allWrong.forEach(a => { const k = a.paperTitle || "Unknown Paper"; if (!g[k]) g[k] = []; g[k].push(a); });
    return g;
  }, [allWrong]);

  if (!user) return null;

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 0.875rem", fontSize: "0.9rem", borderRadius: "9px", outline: "none",
    border: "1.5px solid rgba(212,180,131,0.45)", background: "rgba(253,250,244,0.7)",
    color: "var(--ink-900)", fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  };

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "48rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>Review &amp; Improve</p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.75rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
                Wrong Answer Notebook
              </h1>
              <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
                {loading ? "Loading…" : `${totalCount} question${totalCount !== 1 ? "s" : ""} to review`}
              </p>
            </div>
            <Link href="/student/dashboard"
              style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, marginTop: "0.5rem" }}>
              ← Dashboard
            </Link>
          </div>
        </header>

        {/* Filters */}
        {!loading && totalCount > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "2rem" }}>
            <select value={filterType} style={inputStyle}
              onChange={e => { setFilterType(e.target.value); load(e.target.value, filterPaper); }}>
              <option value="">All types</option>
              <option value="SINGLE">Single Choice</option>
              <option value="MULTIPLE">Multiple Choice</option>
              <option value="TRUEFALSE">True / False</option>
              <option value="FILL">Fill‑in</option>
            </select>
            {paperOptions.length > 0 && (
              <select value={filterPaper} style={inputStyle}
                onChange={e => { setFilterPaper(e.target.value); load(filterType, e.target.value); }}>
                <option value="">All papers</option>
                {paperOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ padding: "1.5rem", borderRadius: "14px", background: "rgba(253,250,244,0.6)", border: "1px solid rgba(212,180,131,0.15)", height: "7rem" }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && totalCount === 0 && (
          <div className="card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{
              width: "3.5rem", height: "3.5rem", borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
              background: "linear-gradient(135deg, rgba(134,168,102,0.22) 0%, rgba(74,110,48,0.12) 100%)",
              boxShadow: "0 2px 10px rgba(134,168,102,0.14)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a6e30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.625rem", fontWeight: 400, color: "var(--ink-700)", marginBottom: "0.5rem" }}>All clear</h2>
            <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", fontFamily: "'DM Sans', sans-serif" }}>No wrong answers — great work!</p>
          </div>
        )}

        {/* Grouped cards */}
        {!loading && totalCount > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {Object.entries(grouped).map(([paperTitle, items]) => (
              <section key={paperTitle}>
                {/* Paper group header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(212,180,131,0.20)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--ink-700)", fontFamily: "'DM Sans', sans-serif", flex: 1 }}>{paperTitle}</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>{items.length} wrong</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {items.map((a, i) => {
                    const badge = typeBadge(a.questionType);
                    return (
                      <div key={`${a.questionId}-${i}`} className="card animate-slide-up"
                        style={{ padding: "1.375rem 1.5rem", animationDelay: `${i * 35}ms`, borderLeft: "3px solid var(--terracotta)", borderRadius: "10px 14px 14px 10px" }}>

                        {/* Meta row */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.5rem", borderRadius: "5px", fontFamily: "'DM Sans', sans-serif", ...badge }}>
                            {a.questionType}
                          </span>
                          {a.categoryName && (
                            <span style={{ fontSize: "0.8125rem", color: "var(--ink-400, #b8a18a)", fontStyle: "italic", fontFamily: "'DM Sans', sans-serif" }}>{a.categoryName}</span>
                          )}
                          <span style={{ fontSize: "0.875rem", color: "var(--ink-300)", marginLeft: "auto", fontFamily: "'DM Sans', sans-serif" }}>
                            {a.scoreEarned}/{a.maxScore} pts
                          </span>
                        </div>

                        {/* Question text */}
                        <p style={{ fontSize: "1rem", color: "var(--ink-900)", lineHeight: 1.55, marginBottom: "1rem" }}>
                          {a.questionContent}
                        </p>

                        {/* Answer comparison */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                          <div style={{ padding: "0.75rem 0.875rem", borderRadius: "9px", background: "rgba(168,84,56,0.06)", border: "1px solid rgba(168,84,56,0.14)" }}>
                            <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--terracotta)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.3rem" }}>Your answer</p>
                            <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--terracotta)" }}>{a.answerGiven || "(unanswered)"}</p>
                          </div>
                          <div style={{ padding: "0.75rem 0.875rem", borderRadius: "9px", background: "rgba(134,168,102,0.06)", border: "1px solid rgba(134,168,102,0.16)" }}>
                            <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4a6e30", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.3rem" }}>Correct answer</p>
                            <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "#4a6e30" }}>{a.correctAnswer}</p>
                          </div>
                        </div>

                        {/* Explanation */}
                        {a.explanation && (
                          <details style={{ marginTop: "1rem" }}>
                            <summary style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                              Explanation
                            </summary>
                            <p style={{ fontSize: "0.9rem", color: "var(--ink-500)", marginTop: "0.5rem", padding: "0.875rem 1rem", background: "rgba(181,115,42,0.05)", borderRadius: "9px", lineHeight: 1.65, border: "1px solid rgba(212,180,131,0.18)" }}>
                              {a.explanation}
                            </p>
                          </details>
                        )}

                        {/* Result link */}
                        {a.sessionId && (
                          <div style={{ marginTop: "0.875rem" }}>
                            <Link href={`/student/results/${a.sessionId}`}
                              style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>
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
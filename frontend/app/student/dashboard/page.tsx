"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import EmptyState from "@/components/EmptyState";

interface ExamPaper {
  id: number; title: string; durationMins: number;
  totalScore: number; status: string; questionCount: number;
}
interface ScoreRecord {
  id: number; sessionId: number; paperId: number; paperTitle: string;
  totalScore: number; paperTotalScore: number; passed: boolean;
}

/* ── Icons ── */
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);
const IconQuestion = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconTrophy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 010-5C5.5 4 6 4.5 6 5.5V9z" /><path d="M18 9h1.5a2.5 2.5 0 000-5C18.5 4 18 4.5 18 5.5V9z" /><path d="M6 9h12v4a6 6 0 01-12 0V9z" /><path d="M15 19H9v-3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 16v3z" />
  </svg>
);
const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6m0-6l6 6" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

/* ── Shared icon container ── */
const iconBox = (bg: string, shadow: string) => ({
  width: "2rem", height: "2rem", borderRadius: "11px", flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: bg, boxShadow: shadow,
} as React.CSSProperties);

/* ── Stat pill ── */
function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.5rem",
      padding: "0.5625rem 0.875rem", borderRadius: "11px",
      background: "rgba(253,250,244,0.65)", backdropFilter: "blur(8px)",
      border: "1px solid rgba(212,180,131,0.25)",
      boxShadow: "0 1px 3px rgba(28,22,18,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
    }}>
      <span style={{ color: "var(--amber-accent)", display: "flex", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ink-400)", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink-900)", marginLeft: "auto", fontFamily: "'DM Sans', sans-serif" }}>
        {value}
      </span>
    </div>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    Promise.all([
      api.get("/api/papers").then(r => r.data.data || []).catch(() => []),
      api.get("/api/scores/my").then(r => r.data.data || []).catch(() => []),
    ]).then(([allPapers, myScores]) => {
      setPapers((allPapers as ExamPaper[]).filter(p => p.status === "PUBLISHED"));
      setScores(myScores as ScoreRecord[]);
    }).finally(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  const takenIds = new Set(scores.map(s => s.paperId));
  const available = papers.filter(p => !takenIds.has(p.id));
  const passedCount = scores.filter(s => s.passed).length;
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + (s.totalScore / s.paperTotalScore) * 100, 0) / scores.length)
    : null;

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
          }}>Student Portal</p>
          <h1 className="font-display" style={{
            fontSize: "2.25rem", fontWeight: 300, letterSpacing: "-0.02em",
            color: "var(--ink-900)", lineHeight: 1.1,
          }}>
            Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--ink-300)", marginTop: "0.375rem" }}>
            Browse available exams and track your performance
          </p>
        </header>

        {/* ── Quick stats ── */}
        {!loading && (
          <div className="animate-slide-up" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem", marginBottom: "2.5rem",
          }}>
            <StatPill icon={<BookIcon />} label="Available" value={available.length} />
            <StatPill icon={<ClipboardIcon />} label="Completed" value={scores.length} />
            <StatPill icon={<IconTrophy />}
              label="Pass rate"
              value={scores.length > 0 ? `${Math.round((passedCount / scores.length) * 100)}%` : "—"} />
          </div>
        )}

        {/* ── Available Exams ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.125rem" }}>
            <div style={iconBox(
              "linear-gradient(135deg, rgba(212,180,131,0.3) 0%, rgba(181,115,42,0.18) 100%)",
              "0 2px 8px rgba(181,115,42,0.14), inset 0 1px 0 rgba(255,255,255,0.4)",
            )}>
              <span style={{ color: "var(--amber-accent)", display: "flex" }}><BookIcon /></span>
            </div>
            <div>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>
                Available Exams
              </p>
              {available.length > 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginTop: "0.125rem" }}>
                  {available.length} exam{available.length !== 1 ? "s" : ""} ready for you
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="card animate-pulse" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                      <div style={{ height: "1.25rem", width: "12rem", borderRadius: "6px", background: "var(--ink-100)" }} />
                      <div style={{ height: "0.75rem", width: "16rem", borderRadius: "6px", background: "rgba(212,180,131,0.25)" }} />
                    </div>
                    <div style={{ height: "2.25rem", width: "7.5rem", borderRadius: "9px", background: "rgba(212,180,131,0.25)" }} />
                  </div>
                </div>
              ))
            ) : available.length > 0 ? (
              available.map((p, i) => (
                <div key={p.id} className="card animate-slide-up group"
                  style={{ padding: "1.125rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", animationDelay: `${i * 60}ms` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{
                      width: "2.5rem", height: "2.5rem", borderRadius: "12px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(135deg, rgba(212,180,131,0.22) 0%, rgba(181,115,42,0.12) 100%)",
                      boxShadow: "0 2px 8px rgba(181,115,42,0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
                    }}>
                      <span style={{ color: "var(--amber-accent)", display: "flex" }}><SparkleIcon /></span>
                    </div>
                    <div>
                      <h3 className="font-display" style={{ fontSize: "1.1875rem", fontWeight: 400, color: "var(--ink-900)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                        {p.title}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "0.25rem" }}>
                        {[
                          [<IconClock key="c" />, `${p.durationMins} min`],
                          [<IconQuestion key="q" />, `${p.questionCount} questions`],
                          [<IconTrophy key="t" />, `${p.totalScore} pts`],
                        ].map(([icon, text], j) => (
                          <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.6875rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>
                            {icon}{text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link href={`/student/exam/${p.id}`} className="btn-primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                    Begin Exam <ArrowIcon />
                  </Link>
                </div>
              ))
            ) : (
              <div className="card">
                <EmptyState
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  title="No exams available"
                  description="Check back later for new assessments from your teachers." />
              </div>
            )}
          </div>
        </section>

        <hr className="divider" />

        {/* ── Your Results ── */}
        <section style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.125rem" }}>
            <div style={iconBox(
              "linear-gradient(135deg, rgba(134,168,102,0.22) 0%, rgba(74,110,48,0.12) 100%)",
              "0 2px 8px rgba(134,168,102,0.12), inset 0 1px 0 rgba(255,255,255,0.4)",
            )}>
              <span style={{ color: "#4a6e30", display: "flex" }}><ClipboardIcon /></span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>
                Your Results
              </p>
              {scores.length > 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginTop: "0.125rem" }}>
                  {passedCount} passed{avgScore !== null ? ` · avg ${avgScore}%` : ""}
                </p>
              )}
            </div>
            {scores.length > 0 && (
              <Link href="/student/wrong-answers" className="btn-ghost"
                style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                Wrong Answer Notebook <ArrowIcon />
              </Link>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="card animate-pulse" style={{ padding: "1rem 1.125rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                      <div style={{ height: "1.125rem", width: "10rem", borderRadius: "6px", background: "var(--ink-100)" }} />
                      <div style={{ height: "0.75rem", width: "7rem", borderRadius: "6px", background: "rgba(212,180,131,0.25)" }} />
                    </div>
                    <div style={{ height: "1.5rem", width: "3.5rem", borderRadius: "9999px", background: "rgba(212,180,131,0.25)" }} />
                  </div>
                </div>
              ))
            ) : scores.length > 0 ? (
              scores.map((s, i) => {
                const pct = Math.round((s.totalScore / s.paperTotalScore) * 100);
                return (
                  <Link key={s.id} href={`/student/results/${s.id}`}
                    className="card animate-slide-up group"
                    style={{ padding: "0.875rem 1.125rem", display: "flex", alignItems: "center", justifyContent: "space-between", animationDelay: `${i * 50}ms` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        width: "2.25rem", height: "2.25rem", borderRadius: "11px", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: s.passed
                          ? "linear-gradient(135deg, rgba(134,168,102,0.2) 0%, rgba(74,110,48,0.12) 100%)"
                          : "linear-gradient(135deg, rgba(168,84,56,0.14) 0%, rgba(168,84,56,0.07) 100%)",
                        boxShadow: s.passed
                          ? "0 2px 6px rgba(134,168,102,0.12), inset 0 1px 0 rgba(255,255,255,0.5)"
                          : "0 2px 6px rgba(168,84,56,0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
                      }}>
                        <span style={{ color: s.passed ? "#4a6e30" : "var(--terracotta)", display: "flex" }}>
                          {s.passed ? <CheckIcon /> : <XIcon />}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-display" style={{ fontSize: "1.0625rem", fontWeight: 400, color: "var(--ink-900)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                          {s.paperTitle}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.125rem" }}>
                          <span style={{ fontSize: "0.6875rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>
                            {s.totalScore} / {s.paperTotalScore} pts
                          </span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: s.passed ? "#4a6e30" : "var(--terracotta)", fontFamily: "'DM Sans', sans-serif" }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: "6rem", height: "0.3125rem", borderRadius: "9999px", overflow: "hidden", background: "rgba(212,180,131,0.2)" }}>
                        <div style={{
                          height: "100%", borderRadius: "9999px", width: `${pct}%`, transition: "width 0.5s ease",
                          background: s.passed ? "linear-gradient(90deg, #86a866, #5a8a3e)" : "linear-gradient(90deg, #c47e4e, #a85438)",
                        }} />
                      </div>
                      <span className={s.passed ? "badge-pass" : "badge-fail"}>
                        {s.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="card">
                <EmptyState
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  title="No results yet"
                  description="Complete your first exam and your scores will appear here." />
              </div>
            )}
          </div>
        </section>

        {/* ── Profile CTA ── */}
        {scores.length === 0 && !loading && (
          <div style={{ marginTop: "1.75rem" }}>
            <Link href="/student/profile" className="card animate-slide-up group"
              style={{ padding: "0.875rem 1.125rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: "2.25rem", height: "2.25rem", borderRadius: "11px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, rgba(212,180,131,0.22) 0%, rgba(181,115,42,0.12) 100%)",
                boxShadow: "0 2px 8px rgba(181,115,42,0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}>
                <span style={{ color: "var(--amber-accent)", display: "flex" }}><UserIcon /></span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--ink-700)", fontFamily: "'DM Sans', sans-serif" }}>
                  Update your profile
                </p>
                <p style={{ fontSize: "0.6875rem", color: "var(--ink-300)", marginTop: "0.125rem", fontFamily: "'DM Sans', sans-serif" }}>
                  Keep your student number and class info up to date
                </p>
              </div>
              <span style={{ color: "var(--ink-300)", display: "flex" }}><ChevronIcon /></span>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
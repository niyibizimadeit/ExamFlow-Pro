"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

interface ExamPaper {
  id: number; title: string; durationMins: number;
  totalScore: number; status: string; questionCount: number;
}
interface ScoreRecord {
  id: number; sessionId: number; paperId: number; paperTitle: string;
  totalScore: number; paperTotalScore: number; passed: boolean;
}

const iconBox = (bg: string, size = "2.5rem"): React.CSSProperties => ({
  width: size, height: size, borderRadius: "11px", flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: bg, boxShadow: "0 2px 8px rgba(181,115,42,0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
});

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      padding: "1.125rem 1.25rem", borderRadius: "12px",
      background: "rgba(253,250,244,0.75)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(212,180,131,0.30)",
      boxShadow: "0 1px 6px rgba(28,22,18,0.05), inset 0 1px 0 rgba(255,255,255,0.65)",
    }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>{label}</p>
      <p style={{ fontSize: "1.75rem", fontWeight: 300, color: "var(--ink-900)", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{value}</p>
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
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "48rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>Student Portal</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.75rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
            Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
            Browse available exams and track your performance
          </p>
        </header>

        {/* Stats */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.875rem", marginBottom: "3rem" }}>
            <StatCard label="Available" value={available.length} />
            <StatCard label="Completed" value={scores.length} />
            <StatCard label="Pass rate" value={scores.length > 0 ? `${Math.round((passedCount / scores.length) * 100)}%` : "—"} />
          </div>
        )}

        {/* Available exams */}
        <section style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>Available Exams</p>
            {available.length > 0 && (
              <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>
                {available.length} exam{available.length !== 1 ? "s" : ""} ready
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {loading ? (
              [0,1].map(i => (
                <div key={i} style={{ padding: "1.375rem", borderRadius: "14px", background: "rgba(253,250,244,0.6)", border: "1px solid rgba(212,180,131,0.2)", height: "5rem" }} />
              ))
            ) : available.length > 0 ? (
              available.map((p, i) => (
                <div key={p.id} className="card animate-slide-up"
                  style={{ padding: "1.375rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", animationDelay: `${i * 60}ms` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={iconBox("linear-gradient(135deg, rgba(212,180,131,0.28) 0%, rgba(181,115,42,0.14) 100%)")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", fontWeight: 400, color: "var(--ink-900)", margin: 0, lineHeight: 1.2 }}>
                        {p.title}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.3rem", fontFamily: "'DM Sans', sans-serif" }}>
                        {p.durationMins} min &middot; {p.questionCount} questions &middot; {p.totalScore} pts
                      </p>
                    </div>
                  </div>
                  <Link href={`/student/exam/${p.id}`} className="btn-primary"
                    style={{ textDecoration: "none", flexShrink: 0, fontSize: "0.9rem", padding: "0.625rem 1.25rem" }}>
                    Begin Exam
                  </Link>
                </div>
              ))
            ) : (
              <div className="card" style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-200, #e0d0c0)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", display: "block" }}>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", fontFamily: "'DM Sans', sans-serif" }}>No exams available right now</p>
                <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", marginTop: "0.375rem", fontFamily: "'DM Sans', sans-serif" }}>Check back later for new assessments</p>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,180,131,0.45), transparent)", marginBottom: "3rem" }} />

        {/* Results */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>Your Results</p>
              {scores.length > 0 && avgScore !== null && (
                <p style={{ fontSize: "0.875rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.25rem", fontFamily: "'DM Sans', sans-serif" }}>
                  {passedCount} passed &middot; avg {avgScore}%
                </p>
              )}
            </div>
            {scores.length > 0 && (
              <Link href="/student/wrong-answers"
                style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>
                Wrong Answer Notebook →
              </Link>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {loading ? (
              [0,1].map(i => (
                <div key={i} style={{ padding: "1.25rem", borderRadius: "14px", background: "rgba(253,250,244,0.6)", border: "1px solid rgba(212,180,131,0.2)", height: "4.5rem" }} />
              ))
            ) : scores.length > 0 ? (
              scores.map((s, i) => {
                const pct = Math.round((s.totalScore / s.paperTotalScore) * 100);
                return (
                  <Link key={s.id} href={`/student/results/${s.id}`} className="card animate-slide-up"
                    style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", textDecoration: "none", animationDelay: `${i * 50}ms` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={iconBox(
                        s.passed
                          ? "linear-gradient(135deg, rgba(134,168,102,0.22) 0%, rgba(74,110,48,0.12) 100%)"
                          : "linear-gradient(135deg, rgba(168,84,56,0.18) 0%, rgba(168,84,56,0.08) 100%)"
                      )}>
                        {s.passed
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a6e30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6m0-6l6 6" /></svg>
                        }
                      </div>
                      <div>
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.125rem", fontWeight: 400, color: "var(--ink-900)", margin: 0 }}>
                          {s.paperTitle}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.2rem", fontFamily: "'DM Sans', sans-serif" }}>
                          {s.totalScore} / {s.paperTotalScore} pts &middot; {pct}%
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
                      <div style={{ width: "4.5rem", height: "4px", borderRadius: "9999px", overflow: "hidden", background: "rgba(212,180,131,0.2)" }}>
                        <div style={{ height: "100%", width: `${pct}%`, borderRadius: "9999px", background: s.passed ? "linear-gradient(90deg, #86a866, #5a8a3e)" : "linear-gradient(90deg, #c47e4e, #a85438)" }} />
                      </div>
                      <span style={{
                        fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem",
                        borderRadius: "9999px", fontFamily: "'DM Sans', sans-serif",
                        ...(s.passed
                          ? { background: "rgba(134,168,102,0.12)", color: "#4a6e30", border: "1px solid rgba(134,168,102,0.30)" }
                          : { background: "rgba(168,84,56,0.10)", color: "var(--terracotta)", border: "1px solid rgba(168,84,56,0.22)" }),
                      }}>
                        {s.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="card" style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-200, #e0d0c0)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", display: "block" }}>
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", fontFamily: "'DM Sans', sans-serif" }}>No completed exams yet</p>
                <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", marginTop: "0.375rem", fontFamily: "'DM Sans', sans-serif" }}>Complete your first exam above to see results here</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
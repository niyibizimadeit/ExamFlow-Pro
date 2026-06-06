"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

const statusStyle = (s: string): React.CSSProperties => {
  if (s === "PUBLISHED") return { background: "rgba(134,168,102,0.12)", color: "#4a6e30", border: "1px solid rgba(134,168,102,0.25)" };
  if (s === "ENDED")     return { background: "rgba(168,84,56,0.10)", color: "var(--terracotta)", border: "1px solid rgba(168,84,56,0.22)" };
  return { background: "rgba(212,180,131,0.14)", color: "var(--ink-500)", border: "1px solid rgba(212,180,131,0.30)" };
};

export default function PapersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [papers, setPapers] = useState<{ id: number; title: string; status: string; durationMins: number; totalScore: number; questionCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/papers").then(r => setPapers(r.data.data || [])).finally(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "56rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>
            Exam Management
          </p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.75rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
                Exam Papers
              </h1>
              <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
                {papers.length} paper{papers.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link href="/teacher/papers/new" className="btn-primary" style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: "0.5rem" }}>
              Create Paper
            </Link>
          </div>
        </header>

        {/* Paper list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {loading ? (
            [0,1,2].map(i => (
              <div key={i} style={{ padding: "1.5rem", borderRadius: "14px", background: "rgba(253,250,244,0.6)", border: "1px solid rgba(212,180,131,0.18)", height: "5.5rem" }} />
            ))
          ) : papers.length > 0 ? (
            papers.map(p => (
              <div key={p.id} className="card animate-slide-up"
                style={{ padding: "1.375rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    width: "2.75rem", height: "2.75rem", borderRadius: "12px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, rgba(212,180,131,0.28) 0%, rgba(181,115,42,0.14) 100%)",
                    boxShadow: "0 2px 8px rgba(181,115,42,0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", fontWeight: 400, color: "var(--ink-900)", margin: 0, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                      {p.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "0.35rem" }}>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "0.15rem 0.5rem", borderRadius: "5px", fontFamily: "'DM Sans', sans-serif", ...statusStyle(p.status) }}>
                        {p.status}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "var(--ink-400, #b8a18a)", fontFamily: "'DM Sans', sans-serif" }}>
                        {p.durationMins} min &middot; {p.totalScore} pts &middot; {p.questionCount} questions
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.625rem", flexShrink: 0 }}>
                  {p.status === "DRAFT" && (
                    <Link href={`/teacher/papers/${p.id}/build`} className="btn-primary" style={{ fontSize: "0.875rem" }}>Build</Link>
                  )}
                  {p.status !== "DRAFT" && (
                    <Link href={`/teacher/papers/${p.id}/results`} className="btn-ghost" style={{ fontSize: "0.875rem" }}>Results</Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-200, #e0d0c0)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", display: "block" }}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", fontFamily: "'DM Sans', sans-serif" }}>No exam papers yet</p>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-300)", marginTop: "0.375rem", fontFamily: "'DM Sans', sans-serif" }}>Create your first paper to get started</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
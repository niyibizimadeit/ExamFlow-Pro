"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import EmptyState from "@/components/EmptyState";

const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const statusBadge = (s: string): React.CSSProperties => {
  if (s === "PUBLISHED") return { background: "rgba(134,168,102,0.12)", color: "#4a6e30", border: "1px solid rgba(134,168,102,0.25)" };
  if (s === "ENDED")     return { background: "rgba(168,84,56,0.10)", color: "var(--terracotta)", border: "1px solid rgba(168,84,56,0.22)" };
  return { background: "rgba(212,180,131,0.10)", color: "var(--ink-400)", border: "1px solid rgba(212,180,131,0.25)" };
};

export default function PapersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [papers, setPapers] = useState<{ id: number; title: string; status: string; durationMins: number; totalScore: number; questionCount: number }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/papers").then(r => setPapers(r.data.data || []));
  }, [router]);

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "2.5rem 2rem 5rem", maxWidth: "52rem", margin: "0 auto" }}>

        <header style={{ marginBottom: "2rem" }}>
          <p className="section-label" style={{ marginBottom: "0.375rem" }}>Exam Management</p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 className="page-heading" style={{ margin: 0 }}>Exam Papers</h1>
              <p className="page-subheading">{papers.length} paper{papers.length !== 1 ? "s" : ""}</p>
            </div>
            <Link href="/teacher/papers/new" className="btn-primary">Create Paper</Link>
          </div>
        </header>

        <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {papers.length > 0 ? papers.map(p => {
            const badge = statusBadge(p.status);
            return (
              <div key={p.id} className="card" style={{ padding: "1.125rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div style={{
                    width: "2.25rem", height: "2.25rem", borderRadius: "11px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, rgba(212,180,131,0.22) 0%, rgba(181,115,42,0.12) 100%)",
                    boxShadow: "0 2px 6px rgba(181,115,42,0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
                  }}>
                    <span style={{ color: "var(--amber-accent)", display: "flex" }}><DocIcon /></span>
                  </div>
                  <div>
                    <h3 className="font-display" style={{ fontSize: "1.125rem", fontWeight: 400, color: "var(--ink-900)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                      {p.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                      <span style={{
                        fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
                        letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif",
                        padding: "0.1rem 0.45rem", borderRadius: "4px", ...badge,
                      }}>{p.status}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>
                        {p.durationMins} min · {p.totalScore} pts · {p.questionCount} questions
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  {p.status === "DRAFT" && (
                    <Link href={`/teacher/papers/${p.id}/build`} className="btn-primary" style={{ fontSize: "0.75rem" }}>Build</Link>
                  )}
                  {p.status !== "DRAFT" && (
                    <Link href={`/teacher/papers/${p.id}/results`} className="btn-ghost" style={{ fontSize: "0.75rem" }}>Results</Link>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="card">
              <EmptyState
                icon={<DocIcon />}
                title="No papers yet"
                description="Create your first exam paper to get started." />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
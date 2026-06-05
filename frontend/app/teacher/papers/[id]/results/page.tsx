"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import EmptyState from "@/components/EmptyState";

const statCard = (label: string, value: string, color: string) => (
  <div className="card" key={label} style={{ padding: "1.125rem 1.25rem" }}>
    <p className="section-label" style={{ marginBottom: "0.375rem" }}>{label}</p>
    <p className="font-display" style={{ fontSize: "1.75rem", fontWeight: 400, color, letterSpacing: "-0.01em" }}>{value}</p>
  </div>
);

const colors = ["#d4a574", "#e0b888", "#b5732a", "#7a3318"];

export default function PaperResultsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [scores, setScores] = useState<Record<string, unknown>[]>([]);
  const [paper, setPaper] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const p = decodeToken(token);
    if (!p || p.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: p.name, role: p.role });
    Promise.all([
      api.get(`/api/scores/stats/${id}`),
      api.get(`/api/scores/paper/${id}`),
      api.get(`/api/papers/${id}`),
    ]).then(([s, sc, pa]) => { setStats(s.data.data); setScores(sc.data.data || []); setPaper(pa.data.data); });
  }, [router, id]);

  if (!user || !stats) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>Loading…</div>
  );

  const dist = stats.distribution ? Object.entries(stats.distribution as Record<string, number>).map(([r, c]) => ({ range: r, count: c })) : [];

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "2.5rem 2rem 5rem", maxWidth: "64rem", margin: "0 auto" }}>

        <header style={{ marginBottom: "2rem" }}>
          <Link href="/teacher/papers" style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none" }}>← Back to Papers</Link>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 300, color: "var(--ink-900)", letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: "0.375rem" }}>
            {String(paper?.title || `Paper ${id}`)} — Results
          </h1>
        </header>

        {/* Stat cards */}
        <div className="animate-slide-up" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          {statCard("Average Score", String(stats.avg ?? "—"), "var(--ink-700)")}
          {statCard("Highest Score", String(stats.max ?? "—"), "#4a6e30")}
          {statCard("Lowest Score", String(stats.min ?? "—"), "var(--amber-accent)")}
          {statCard("Pass Rate", `${Math.round(Number(stats.passRate || 0) * 100)}%`, "var(--terracotta)")}
        </div>

        {/* Score distribution chart */}
        {dist.length > 0 && (
          <div className="card animate-slide-up" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 className="section-label" style={{ marginBottom: "1rem" }}>Score Distribution</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dist}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,180,131,0.2)" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "var(--ink-300)", fontFamily: "'DM Sans'" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--ink-300)", fontFamily: "'DM Sans'" }} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid rgba(212,180,131,0.35)", background: "rgba(253,250,244,0.96)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {dist.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Student results table */}
        <div className="card animate-slide-up" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.25rem 0" }}>
            <h2 className="section-label">Student Results ({Number(stats.count || 0)})</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,180,131,0.15)" }}>
                {["Student", "Score", "Status", "Date"].map((h, i) => (
                  <th key={i} style={{
                    textAlign: i === 0 ? "left" : "left", padding: "0.75rem 1.25rem",
                    fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.08em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores.length > 0 ? scores.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(212,180,131,0.06)", transition: "background 0.12s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,180,131,0.06)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.8125rem", fontWeight: 500, color: "var(--ink-700)", fontFamily: "'DM Sans', sans-serif" }}>{String(s.studentName || `Student #${i + 1}`)}</td>
                  <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.8125rem", color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif" }}>{String(s.totalScore)} / {String(s.paperTotalScore)}</td>
                  <td style={{ padding: "0.75rem 1.25rem" }}>
                    <span className={s.passed ? "badge-pass" : "badge-fail"}>{s.passed ? "Pass" : "Fail"}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.75rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>{String(s.gradedAt).split("T")[0]}</td>
                </tr>
              )) : (
                <tr><td colSpan={4}>
                  <EmptyState
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    title="No submissions yet" description="Student results will appear here after exams are completed." />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
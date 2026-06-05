"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import EmptyState from "@/components/EmptyState";
import Toast from "@/components/Toast";

const typeBadge = (t: string): React.CSSProperties => {
  const m: Record<string, React.CSSProperties> = {
    SINGLE:    { background: "rgba(59,130,246,0.10)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.25)" },
    MULTIPLE:  { background: "rgba(147,51,234,0.10)", color: "#7c3aed", border: "1px solid rgba(147,51,234,0.25)" },
    TRUEFALSE: { background: "rgba(16,185,129,0.10)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" },
    FILL:      { background: "rgba(249,115,22,0.10)", color: "#ea580c", border: "1px solid rgba(249,115,22,0.25)" },
  };
  return m[t] || { background: "rgba(212,180,131,0.10)", color: "var(--ink-500)", border: "1px solid rgba(212,180,131,0.25)" };
};

export default function TeacherQuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [questions, setQuestions] = useState<{ id: number; content: string; type: string; difficulty: number; categoryName: string; defaultScore: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/categories").then(r => setCategories(r.data.data || []));
  }, [router]);

  const fetch = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ size: "10", page: String(page) });
    if (type) p.set("type", type);
    if (categoryId) p.set("categoryId", categoryId);
    if (difficulty) p.set("difficulty", difficulty);
    if (keyword) p.set("keyword", keyword);
    api.get(`/api/questions?${p}`).then(r => {
      setQuestions(r.data.data.content);
      setTotal(r.data.data.totalElements);
      setTotalPages(r.data.data.totalPages);
    }).finally(() => setLoading(false));
  }, [page, type, categoryId, difficulty, keyword]);

  useEffect(() => { fetch(); }, [fetch]);

  async function del(id: number) {
    if (!confirm("Delete this question?")) return;
    try { await api.delete(`/api/questions/${id}`); setToast({ msg: "Question deleted", type: "success" }); fetch(); }
    catch { setToast({ msg: "Cannot delete: question is used in an exam paper", type: "error" }); }
  }

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "2.5rem 2rem 5rem", maxWidth: "64rem", margin: "0 auto" }}>

        {/* ── Header (matches results page back-link + heading pattern) ── */}
        <header style={{ marginBottom: "2rem" }}>
          <p className="section-label" style={{ marginBottom: "0.5rem" }}>Question Bank</p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 className="font-display" style={{
                fontSize: "2.25rem", fontWeight: 300, letterSpacing: "-0.02em",
                color: "var(--ink-900)", lineHeight: 1.1, margin: 0,
              }}>Questions</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", marginTop: "0.375rem", fontFamily: "'DM Sans', sans-serif" }}>
                {total} question{total !== 1 ? "s" : ""} in bank
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.625rem" }}>
              <Link href="/teacher/questions/categories" className="btn-ghost">Categories</Link>
              <Link href="/teacher/questions/new" className="btn-primary">New Question</Link>
            </div>
          </div>
        </header>

        {/* ── Filters (matches exam page input proportions) ── */}
        <div className="animate-slide-up" style={{
          display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "1.5rem",
        }}>
          <input value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }}
            placeholder="Search questions…" className="input-glass" style={{ width: "14rem" }} />
          <select value={type} onChange={e => { setType(e.target.value); setPage(0); }}
            className="select-glass" style={{ width: "auto" }}>
            <option value="">All types</option>
            <option value="SINGLE">Single Choice</option>
            <option value="MULTIPLE">Multiple Choice</option>
            <option value="TRUEFALSE">True / False</option>
            <option value="FILL">Fill‑in</option>
          </select>
          <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(0); }}
            className="select-glass" style={{ width: "auto" }}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(0); }}
            className="select-glass" style={{ width: "auto" }}>
            <option value="">Any level</option>
            <option value="1">⭐ Easy</option>
            <option value="2">⭐⭐ Medium</option>
            <option value="3">⭐⭐⭐ Hard</option>
          </select>
        </div>

        {/* ── Table (matches results page table proportions) ── */}
        <div className="card animate-slide-up" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,180,131,0.18)" }}>
                {["Question", "Type", "Category", "Level", "Score", ""].map((h, i) => (
                  <th key={i} style={{
                    textAlign: i === 5 ? "right" : "left", padding: "0.75rem 1.25rem",
                    fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.08em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(212,180,131,0.08)" }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: "0.875rem 1.25rem" }}>
                        <div className="animate-pulse" style={{
                          height: "1rem", borderRadius: "5px",
                          background: j === 0 ? "var(--ink-100)" : "rgba(212,180,131,0.2)",
                          width: j === 5 ? "4.5rem" : j === 0 ? "75%" : "55%",
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : questions.length > 0 ? (
                questions.map(q => {
                  const badge = typeBadge(q.type);
                  return (
                    <tr key={q.id} style={{ borderBottom: "1px solid rgba(212,180,131,0.06)", transition: "background 0.12s ease" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,180,131,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "0.875rem 1.25rem", maxWidth: "22rem" }}>
                        <p style={{
                          fontSize: "0.875rem", color: "var(--ink-700)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{q.content}</p>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span style={{
                          fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
                          letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif",
                          padding: "0.2rem 0.55rem", borderRadius: "5px", ...badge,
                        }}>{q.type}</span>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8125rem", color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif" }}>{q.categoryName}</td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8125rem" }}>
                        {q.difficulty === 1 ? "⭐" : q.difficulty === 2 ? "⭐⭐" : "⭐⭐⭐"}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8125rem", color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif" }}>{q.defaultScore} pts</td>
                      <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                        <Link href={`/teacher/questions/${q.id}/edit`}
                          style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--amber-accent)", marginRight: "1.125rem", textDecoration: "none" }}>
                          Edit
                        </Link>
                        <button onClick={() => del(q.id)}
                          style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6}>
                  <EmptyState
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    title="No questions found"
                    description="Create your first question or adjust the filters."
                  />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination (matches exam page sidebar button proportions) ── */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.375rem", marginTop: "1.5rem" }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{
                minWidth: "2.5rem", height: "2.5rem", borderRadius: "10px",
                fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s ease",
                background: page === i ? "linear-gradient(135deg, var(--amber-accent), #7a3318)" : "rgba(253,250,244,0.7)",
                color: page === i ? "#fdf8f0" : "var(--ink-500)",
                boxShadow: page === i ? "0 2px 8px rgba(181,115,42,0.22)" : "none",
                border: page === i ? "none" : "1px solid rgba(212,180,131,0.35)",
              }}>{i + 1}</button>
            ))}
          </div>
        )}

        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </>
  );
}
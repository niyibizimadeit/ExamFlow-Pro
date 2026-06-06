"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

const typeBadge = (t: string): React.CSSProperties => {
  const m: Record<string, React.CSSProperties> = {
    SINGLE:    { background: "rgba(59,130,246,0.10)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.22)" },
    MULTIPLE:  { background: "rgba(147,51,234,0.10)", color: "#7c3aed", border: "1px solid rgba(147,51,234,0.22)" },
    TRUEFALSE: { background: "rgba(16,185,129,0.10)", color: "#059669", border: "1px solid rgba(16,185,129,0.22)" },
    FILL:      { background: "rgba(249,115,22,0.10)", color: "#ea580c", border: "1px solid rgba(249,115,22,0.22)" },
  };
  return m[t] || { background: "rgba(212,180,131,0.10)", color: "var(--ink-500)", border: "1px solid rgba(212,180,131,0.25)" };
};

const inputStyle: React.CSSProperties = {
  padding: "0.625rem 0.875rem", fontSize: "0.9rem", borderRadius: "9px", outline: "none",
  border: "1.5px solid rgba(212,180,131,0.45)", background: "rgba(253,250,244,0.7)",
  color: "var(--ink-900)", fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.15s ease",
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

  const fetchQ = useCallback(() => {
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

  useEffect(() => { fetchQ(); }, [fetchQ]);

  async function del(id: number) {
    if (!confirm("Delete this question?")) return;
    try { await api.delete(`/api/questions/${id}`); setToast({ msg: "Question deleted", type: "success" }); fetchQ(); }
    catch { setToast({ msg: "Cannot delete: question is used in a paper", type: "error" }); }
  }

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "68rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>
            Question Bank
          </p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.75rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
                Questions
              </h1>
              <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
                {total} question{total !== 1 ? "s" : ""} in bank
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexShrink: 0 }}>
              <Link href="/teacher/questions/categories" style={{
                display: "inline-flex", alignItems: "center", padding: "0.625rem 1.25rem",
                borderRadius: "10px", fontSize: "0.9375rem", fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif", color: "var(--ink-500)",
                background: "transparent", border: "1.5px solid rgba(212,180,131,0.45)",
                textDecoration: "none", transition: "all 0.12s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,180,131,0.15)"; e.currentTarget.style.color = "var(--ink-700)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-500)"; }}
              >Categories</Link>
              <Link href="/teacher/questions/new" style={{
                display: "inline-flex", alignItems: "center", padding: "0.625rem 1.25rem",
                borderRadius: "10px", fontSize: "0.9375rem", fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif", color: "#fdf8f0",
                background: "linear-gradient(135deg, var(--amber-accent) 0%, #7a3318 100%)",
                boxShadow: "0 2px 10px rgba(181,115,42,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
                textDecoration: "none", transition: "all 0.15s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(181,115,42,0.36)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(181,115,42,0.28)"; }}
              >New Question</Link>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <input value={keyword} placeholder="Search questions…" style={{ ...inputStyle, width: "16rem" }}
            onChange={e => { setKeyword(e.target.value); setPage(0); }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--amber-accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(212,180,131,0.45)")} />
          {[
            { value: type, setter: (v: string) => { setType(v); setPage(0); }, opts: [["","All types"],["SINGLE","Single Choice"],["MULTIPLE","Multiple Choice"],["TRUEFALSE","True / False"],["FILL","Fill‑in"]] },
            { value: categoryId, setter: (v: string) => { setCategoryId(v); setPage(0); }, opts: [["","All categories"], ...categories.map(c => [String(c.id), c.name])] },
            { value: difficulty, setter: (v: string) => { setDifficulty(v); setPage(0); }, opts: [["","Any level"],["1","⭐ Easy"],["2","⭐⭐ Medium"],["3","⭐⭐⭐ Hard"]] },
          ].map((s, i) => (
            <select key={i} value={s.value} style={inputStyle}
              onChange={e => s.setter(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--amber-accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(212,180,131,0.45)")}>
              {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>

        {/* Table */}
        <div className="card animate-slide-up" style={{ overflow: "hidden", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,180,131,0.22)" }}>
                {["Question", "Type", "Category", "Level", "Score", ""].map((h, i) => (
                  <th key={i} style={{
                    textAlign: i === 5 ? "right" : "left",
                    padding: "1rem 1.375rem",
                    fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.10em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(212,180,131,0.08)" }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: "1rem 1.375rem" }}>
                        <div style={{ height: "1rem", borderRadius: "5px", background: j === 0 ? "var(--ink-100)" : "rgba(212,180,131,0.18)", width: j === 5 ? "5rem" : j === 0 ? "70%" : "50%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : questions.length > 0 ? (
                questions.map(q => {
                  const badge = typeBadge(q.type);
                  return (
                    <tr key={q.id} style={{ borderBottom: "1px solid rgba(212,180,131,0.08)", transition: "background 0.12s ease" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,180,131,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "1rem 1.375rem", maxWidth: "24rem" }}>
                        <p style={{ fontSize: "0.9375rem", color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                          {q.content}
                        </p>
                      </td>
                      <td style={{ padding: "1rem 1.375rem" }}>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "0.2rem 0.55rem", borderRadius: "5px", fontFamily: "'DM Sans', sans-serif", ...badge }}>
                          {q.type}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.375rem", fontSize: "0.9rem", color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif" }}>{q.categoryName}</td>
                      <td style={{ padding: "1rem 1.375rem", fontSize: "0.9rem" }}>
                        {q.difficulty === 1 ? "⭐" : q.difficulty === 2 ? "⭐⭐" : "⭐⭐⭐"}
                      </td>
                      <td style={{ padding: "1rem 1.375rem", fontSize: "0.9rem", color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif" }}>{q.defaultScore} pts</td>
                      <td style={{ padding: "1rem 1.375rem", textAlign: "right", whiteSpace: "nowrap" }}>
                        <Link href={`/teacher/questions/${q.id}/edit`}
                          style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--amber-accent)", marginRight: "1.25rem", textDecoration: "none" }}>
                          Edit
                        </Link>
                        <button onClick={() => del(q.id)}
                          style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6} style={{ padding: "3.5rem", textAlign: "center" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-200, #e0d0c0)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", display: "block" }}>
                    <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", fontFamily: "'DM Sans', sans-serif" }}>No questions found</p>
                  <p style={{ fontSize: "0.9rem", color: "var(--ink-300)", marginTop: "0.375rem", fontFamily: "'DM Sans', sans-serif" }}>Create your first question or adjust the filters</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{
                minWidth: "2.75rem", height: "2.75rem", borderRadius: "10px",
                fontSize: "0.9375rem", fontWeight: 500, cursor: "pointer",
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
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

export default function PaperBuildPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [paper, setPaper] = useState<{ id: number; title: string; status: string; totalScore: number; questionCount: number; questions?: { id: number; questionId: number; questionContent: string; questionType: string; difficulty: number; orderNum: number; score: number }[] } | null>(null);
  const [questions, setQuestions] = useState<{ id: number; content: string; type: string; difficulty: number; categoryName: string }[]>([]);
  const [paperQs, setPaperQs] = useState<{ id: number; questionId: number; questionContent: string; questionType: string; difficulty: number; orderNum: number; score: number }[]>([]);
  const [tab, setTab] = useState<"manual" | "assembly">("manual");
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [sc, setSc] = useState<Record<number, string>>({});
  const [rules, setRules] = useState<{ questionType: string; count: number; scoreEach: number; difficulty?: number }[]>([{ questionType: "SINGLE", count: 10, scoreEach: 2 }]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchPaper = useCallback(() => {
    api.get(`/api/papers/${id}/preview`).then(r => {
      setPaper(r.data.data); setPaperQs(r.data.data.questions || []);
      const s: Record<number, string> = {};
      (r.data.data.questions || []).forEach((q: { questionId: number; score: number }) => { s[q.questionId] = String(q.score); });
      setSc(s);
    });
  }, [id]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const p = decodeToken(token);
    if (!p || p.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: p.name, role: p.role });
    fetchPaper();
  }, [router, id, fetchPaper]);

  useEffect(() => {
    const p = new URLSearchParams({ size: "20" });
    if (keyword) p.set("keyword", keyword);
    if (type) p.set("type", type);
    api.get(`/api/questions?${p}`).then(r => setQuestions(r.data.data.content || []));
  }, [keyword, type]);

  async function add(qId: number) {
    try { await api.post(`/api/papers/${id}/questions`, { questions: [{ questionId: qId, score: parseFloat(sc[qId] || "2") }] }); setToast({ msg: "Added", type: "success" }); fetchPaper(); }
    catch { setToast({ msg: "Failed to add", type: "error" }); }
  }
  async function remove(qId: number) {
    try { await api.delete(`/api/papers/${id}/questions/${qId}`); setToast({ msg: "Removed", type: "success" }); fetchPaper(); }
    catch { setToast({ msg: "Failed to remove", type: "error" }); }
  }
  async function assemble() {
    try { await api.put(`/api/papers/${id}/rules`, rules); await api.post(`/api/papers/${id}/assemble`); setToast({ msg: "Assembly complete", type: "success" }); fetchPaper(); }
    catch (err: unknown) { setToast({ msg: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Assembly failed", type: "error" }); }
  }
  async function publish() {
    if (!confirm("Once published, questions cannot be changed. Continue?")) return;
    try { await api.put(`/api/papers/${id}/publish`); setToast({ msg: "Paper published", type: "success" }); fetchPaper(); }
    catch (err: unknown) { setToast({ msg: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Publish failed", type: "error" }); }
  }

  if (!user || !paper) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>Loading…</div>
  );

  const isDraft = paper.status === "DRAFT";
  const total = paperQs.reduce((s, q) => s + q.score, 0);

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "2.5rem 2rem 5rem", maxWidth: "64rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "1.5rem" }}>
          <Link href="/teacher/papers" style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none" }}>← Back to Papers</Link>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: "0.5rem" }}>
            <div>
              <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 300, color: "var(--ink-900)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                {paper.title}
              </h1>
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-300)", marginTop: "0.25rem", fontFamily: "'DM Sans', sans-serif" }}>
                {paper.questionCount} questions · {total}/{paper.totalScore} pts ·{" "}
                <span style={{ fontWeight: 600, color: paper.status === "PUBLISHED" ? "#4a6e30" : "var(--ink-400)" }}>{paper.status}</span>
              </p>
            </div>
            {isDraft && <button onClick={publish} className="btn-primary" style={{ background: "linear-gradient(135deg, #4a6e30, #3b5725)" }}>Publish Paper</button>}
          </div>
        </header>

        {/* Tabs */}
        {isDraft && (
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem" }}>
            {(["manual", "assembly"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: "0.5rem 1rem", borderRadius: "9px", fontSize: "0.8125rem", fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", border: "none", cursor: "pointer", transition: "all 0.12s ease",
                  background: tab === t ? "linear-gradient(135deg, var(--amber-accent), #7a3318)" : "transparent",
                  color: tab === t ? "#fdf8f0" : "var(--ink-400)",
                }}>{t === "manual" ? "Manual Build" : "Rule Assembly"}</button>
            ))}
          </div>
        )}

        {/* Manual tab */}
        {tab === "manual" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            {/* Question bank */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <h2 className="section-label" style={{ marginBottom: "0.875rem" }}>Question Bank</h2>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem" }}>
                <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search…" className="input-glass" style={{ flex: 1 }} />
                <select value={type} onChange={e => setType(e.target.value)} className="select-glass" style={{ width: "auto", fontSize: "0.75rem" }}>
                  <option value="">All</option><option value="SINGLE">Single</option><option value="MULTIPLE">Multi</option><option value="TRUEFALSE">T/F</option><option value="FILL">Fill</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "26rem", overflowY: "auto" }}>
                {questions.filter(q => !paperQs.some(p => p.questionId === q.id)).map(q => (
                  <div key={q.id} style={{
                    display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.625rem",
                    borderRadius: "8px", transition: "background 0.12s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,180,131,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>{q.content}</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--ink-300)", marginTop: "0.1rem", fontFamily: "'DM Sans', sans-serif" }}>{q.type} · {q.categoryName}</p>
                    </div>
                    <input type="number" value={sc[q.id] || "2"} onChange={e => setSc({ ...sc, [q.id]: e.target.value })}
                      style={{ width: "3rem", textAlign: "center", fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}
                      className="input-glass" min="0.5" step="0.5" />
                    <button onClick={() => add(q.id)}
                      style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                      + Add
                    </button>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", textAlign: "center", padding: "2rem", fontFamily: "'DM Sans', sans-serif" }}>No questions found</p>
                )}
              </div>
            </div>

            {/* Paper questions */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <h2 className="section-label" style={{ marginBottom: "0.875rem" }}>Paper Questions ({paperQs.length})</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "26rem", overflowY: "auto" }}>
                {paperQs.length > 0 ? paperQs.map((pq, i) => (
                  <div key={pq.id} style={{
                    display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.625rem",
                    borderRadius: "8px", background: "rgba(181,115,42,0.05)",
                  }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-400)", width: "1.5rem", fontFamily: "'DM Sans', sans-serif" }}>{i + 1}.</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>{pq.questionContent}</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--ink-300)", marginTop: "0.1rem", fontFamily: "'DM Sans', sans-serif" }}>{pq.questionType} · {pq.score} pts</p>
                    </div>
                    {isDraft && (
                      <button onClick={() => remove(pq.questionId)}
                        style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>Remove</button>
                    )}
                  </div>
                )) : (
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", textAlign: "center", padding: "2rem", fontFamily: "'DM Sans', sans-serif" }}>No questions added yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assembly tab */}
        {tab === "assembly" && isDraft && (
          <div className="card animate-slide-up" style={{ padding: "1.5rem", maxWidth: "40rem" }}>
            <h2 className="section-label" style={{ marginBottom: "0.25rem" }}>Rule-Based Assembly</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginBottom: "1.25rem", fontFamily: "'DM Sans', sans-serif" }}>
              Define rules and the system auto-selects questions. Existing questions will be replaced.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.25rem" }}>
              {rules.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.625rem 0.75rem", borderRadius: "10px",
                  background: "rgba(212,180,131,0.08)",
                }}>
                  <select value={r.questionType} onChange={e => { const n = [...rules]; n[i].questionType = e.target.value; setRules(n); }}
                    className="select-glass" style={{ width: "auto", fontSize: "0.75rem" }}>
                    <option value="SINGLE">Single</option><option value="MULTIPLE">Multiple</option><option value="TRUEFALSE">T/F</option><option value="FILL">Fill</option>
                  </select>
                  <select value={r.difficulty || ""} onChange={e => { const n = [...rules]; n[i].difficulty = e.target.value ? parseInt(e.target.value) : undefined; setRules(n); }}
                    className="select-glass" style={{ width: "auto", fontSize: "0.75rem" }}>
                    <option value="">Any Level</option><option value="1">⭐ Easy</option><option value="2">⭐⭐ Medium</option><option value="3">⭐⭐⭐ Hard</option>
                  </select>
                  <input type="number" value={r.count} onChange={e => { const n = [...rules]; n[i].count = parseInt(e.target.value) || 1; setRules(n); }}
                    className="input-glass" style={{ width: "3.5rem", textAlign: "center" }} placeholder="Count" />
                  <input type="number" value={r.scoreEach} onChange={e => { const n = [...rules]; n[i].scoreEach = parseFloat(e.target.value) || 1; setRules(n); }}
                    className="input-glass" style={{ width: "3.5rem", textAlign: "center" }} placeholder="Score" step="0.5" />
                  {rules.length > 1 && (
                    <button onClick={() => setRules(rules.filter((_, j) => j !== i))}
                      style={{ fontSize: "0.75rem", color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.625rem" }}>
              <button onClick={() => setRules([...rules, { questionType: "SINGLE", count: 5, scoreEach: 2 }])} className="btn-ghost" style={{ fontSize: "0.75rem" }}>+ Add Rule</button>
              <button onClick={assemble} className="btn-primary">Run Assembly</button>
            </div>
          </div>
        )}

      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
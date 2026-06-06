"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", padding: "0.625rem 1.25rem",
  borderRadius: "10px", fontSize: "0.9375rem", fontWeight: 500,
  fontFamily: "'DM Sans', sans-serif", color: "#fdf8f0", border: "none", cursor: "pointer",
  background: "linear-gradient(135deg, var(--amber-accent) 0%, #7a3318 100%)",
  boxShadow: "0 2px 10px rgba(181,115,42,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
  transition: "all 0.15s ease",
};
const btnGhost: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", padding: "0.625rem 1.125rem",
  borderRadius: "10px", fontSize: "0.9375rem", fontWeight: 500,
  fontFamily: "'DM Sans', sans-serif", color: "var(--ink-500)", border: "none", cursor: "pointer",
  background: "transparent", border: "1.5px solid rgba(212,180,131,0.45)" as never,
  transition: "all 0.12s ease",
};
const inputS: React.CSSProperties = {
  padding: "0.5rem 0.75rem", fontSize: "0.875rem", borderRadius: "8px", outline: "none",
  border: "1.5px solid rgba(212,180,131,0.45)", background: "rgba(253,250,244,0.7)",
  color: "var(--ink-900)", fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.15s ease",
};

export default function PaperBuildPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [paper, setPaper] = useState<{
    id: number; title: string; status: string; totalScore: number; questionCount: number;
    questions?: { id: number; questionId: number; questionContent: string; questionType: string; difficulty: number; orderNum: number; score: number }[]
  } | null>(null);
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
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "68rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "2rem" }}>
          <Link href="/teacher/papers" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none" }}>
            ← Back to Papers
          </Link>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: "0.875rem", gap: "1rem" }}>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
                {paper.title}
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.4rem", fontFamily: "'DM Sans', sans-serif" }}>
                {paper.questionCount} questions &middot; {total}/{paper.totalScore} pts &middot;{" "}
                <span style={{ fontWeight: 600, color: paper.status === "PUBLISHED" ? "#4a6e30" : "var(--ink-400)" }}>
                  {paper.status}
                </span>
              </p>
            </div>
            {isDraft && (
              <button onClick={publish}
                style={{ ...btnPrimary, background: "linear-gradient(135deg, #4a6e30, #3b5725)", boxShadow: "0 2px 10px rgba(74,110,48,0.28)", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                Publish Paper
              </button>
            )}
          </div>
        </header>

        {/* Tabs */}
        {isDraft && (
          <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.75rem", padding: "0.25rem", background: "rgba(212,180,131,0.12)", borderRadius: "11px", width: "fit-content" }}>
            {(["manual", "assembly"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "0.5rem 1.25rem", borderRadius: "9px", fontSize: "0.9rem", fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif", border: "none", cursor: "pointer", transition: "all 0.15s ease",
                background: tab === t ? "linear-gradient(135deg, var(--amber-accent), #7a3318)" : "transparent",
                color: tab === t ? "#fdf8f0" : "var(--ink-400)",
                boxShadow: tab === t ? "0 2px 8px rgba(181,115,42,0.22)" : "none",
              }}>
                {t === "manual" ? "Manual Build" : "Rule Assembly"}
              </button>
            ))}
          </div>
        )}

        {/* Manual tab */}
        {tab === "manual" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

            {/* Question bank */}
            <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "1rem" }}>
                Question Bank
              </p>
              <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem" }}>
                <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search…"
                  style={{ ...inputS, flex: 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--amber-accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(212,180,131,0.45)")} />
                <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputS, cursor: "pointer" }}>
                  <option value="">All</option>
                  <option value="SINGLE">Single</option>
                  <option value="MULTIPLE">Multi</option>
                  <option value="TRUEFALSE">T/F</option>
                  <option value="FILL">Fill</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "28rem", overflowY: "auto" }}>
                {questions.filter(q => !paperQs.some(p => p.questionId === q.id)).map(q => (
                  <div key={q.id}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: "9px", transition: "background 0.12s ease" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,180,131,0.09)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.875rem", color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                        {q.content}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginTop: "0.15rem", fontFamily: "'DM Sans', sans-serif", margin: "0.15rem 0 0" }}>
                        {q.type} &middot; {q.categoryName}
                      </p>
                    </div>
                    <input type="number" value={sc[q.id] || "2"} onChange={e => setSc({ ...sc, [q.id]: e.target.value })}
                      style={{ ...inputS, width: "3.5rem", textAlign: "center", padding: "0.375rem 0.5rem" }}
                      min="0.5" step="0.5" />
                    <button onClick={() => add(q.id)} style={{
                      fontSize: "0.875rem", fontWeight: 600, color: "var(--amber-accent)",
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", flexShrink: 0, padding: "0.25rem",
                    }}>+ Add</button>
                  </div>
                ))}
                {questions.filter(q => !paperQs.some(p => p.questionId === q.id)).length === 0 && (
                  <p style={{ fontSize: "0.9rem", color: "var(--ink-300)", textAlign: "center", padding: "2.5rem 1rem", fontFamily: "'DM Sans', sans-serif" }}>
                    No questions found
                  </p>
                )}
              </div>
            </div>

            {/* Paper questions */}
            <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "1rem" }}>
                Paper Questions ({paperQs.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "28rem", overflowY: "auto" }}>
                {paperQs.length > 0 ? paperQs.map((pq, i) => (
                  <div key={pq.id} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem",
                    borderRadius: "9px", background: "rgba(181,115,42,0.06)",
                  }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink-300)", width: "1.5rem", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                      {i + 1}.
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.875rem", color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                        {pq.questionContent}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginTop: "0.15rem", fontFamily: "'DM Sans', sans-serif", margin: "0.15rem 0 0" }}>
                        {pq.questionType} &middot; {pq.score} pts
                      </p>
                    </div>
                    {isDraft && (
                      <button onClick={() => remove(pq.questionId)} style={{
                        fontSize: "0.875rem", fontWeight: 500, color: "var(--ink-300)",
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                      }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>
                        Remove
                      </button>
                    )}
                  </div>
                )) : (
                  <p style={{ fontSize: "0.9rem", color: "var(--ink-300)", textAlign: "center", padding: "2.5rem 1rem", fontFamily: "'DM Sans', sans-serif" }}>
                    No questions added yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assembly tab */}
        {tab === "assembly" && isDraft && (
          <div className="card animate-slide-up" style={{ padding: "2rem", maxWidth: "42rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.375rem" }}>
              Rule-Based Assembly
            </p>
            <p style={{ fontSize: "0.9375rem", color: "var(--ink-400, #b8a18a)", marginBottom: "1.5rem", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55 }}>
              Define rules and the system auto-selects questions. Existing questions will be replaced.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {rules.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.875rem 1rem", borderRadius: "11px",
                  background: "rgba(212,180,131,0.09)", flexWrap: "wrap",
                }}>
                  <select value={r.questionType} onChange={e => { const n = [...rules]; n[i].questionType = e.target.value; setRules(n); }} style={{ ...inputS, cursor: "pointer" }}>
                    <option value="SINGLE">Single</option>
                    <option value="MULTIPLE">Multiple</option>
                    <option value="TRUEFALSE">T/F</option>
                    <option value="FILL">Fill</option>
                  </select>
                  <select value={r.difficulty || ""} onChange={e => { const n = [...rules]; n[i].difficulty = e.target.value ? parseInt(e.target.value) : undefined; setRules(n); }} style={{ ...inputS, cursor: "pointer" }}>
                    <option value="">Any Level</option>
                    <option value="1">⭐ Easy</option>
                    <option value="2">⭐⭐ Medium</option>
                    <option value="3">⭐⭐⭐ Hard</option>
                  </select>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <input type="number" value={r.count} onChange={e => { const n = [...rules]; n[i].count = parseInt(e.target.value) || 1; setRules(n); }}
                      style={{ ...inputS, width: "4rem", textAlign: "center" }} placeholder="Count" />
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>×</span>
                    <input type="number" value={r.scoreEach} onChange={e => { const n = [...rules]; n[i].scoreEach = parseFloat(e.target.value) || 1; setRules(n); }}
                      style={{ ...inputS, width: "4rem", textAlign: "center" }} placeholder="Pts" step="0.5" />
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>pts each</span>
                  </div>
                  {rules.length > 1 && (
                    <button onClick={() => setRules(rules.filter((_, j) => j !== i))}
                      style={{ fontSize: "1rem", color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", marginLeft: "auto", lineHeight: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setRules([...rules, { questionType: "SINGLE", count: 5, scoreEach: 2 }])}
                style={btnGhost}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,180,131,0.15)"; e.currentTarget.style.color = "var(--ink-700)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-500)"; }}>
                + Add Rule
              </button>
              <button onClick={assemble}
                style={btnPrimary}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                Run Assembly
              </button>
            </div>
          </div>
        )}

      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
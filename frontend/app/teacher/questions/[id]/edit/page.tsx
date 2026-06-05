"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

interface Option { label: string; content: string; isCorrect: boolean; }
interface StdAns { answerText: string; matchMode: string; }

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.6875rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.10em",
  color: "var(--ink-400)", marginBottom: "0.5rem",
  fontFamily: "'DM Sans', sans-serif",
};

export default function EditQuestionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [type, setType] = useState("SINGLE");
  const [difficulty, setDifficulty] = useState(1);
  const [defaultScore, setDefaultScore] = useState("2");
  const [explanation, setExplanation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [stdAnswers, setStdAnswers] = useState<StdAns[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });

    Promise.all([
      api.get("/api/categories"),
      api.get(`/api/questions/${id}`),
    ]).then(([catRes, qRes]) => {
      setCategories(catRes.data.data);
      const q = qRes.data.data;
      setContent(q.content);
      setType(q.type);
      setDifficulty(q.difficulty);
      setDefaultScore(String(q.defaultScore));
      setExplanation(q.explanation || "");
      setCategoryId(String(q.categoryId));
      if (q.options?.length) setOptions(q.options.map((o: Record<string, unknown>) => ({ label: o.label as string, content: o.content as string, isCorrect: o.isCorrect as boolean })));
      if (q.stdAnswers?.length) setStdAnswers(q.stdAnswers.map((a: Record<string, unknown>) => ({ answerText: a.answerText as string, matchMode: a.matchMode as string })));
      setLoading(false);
    });
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const body: Record<string, unknown> = { content, type, difficulty, defaultScore: parseFloat(defaultScore) || 2, explanation, categoryId: parseInt(categoryId) };
      if (["SINGLE", "MULTIPLE", "TRUEFALSE"].includes(type)) body.options = options.filter(o => o.content.trim());
      if (type === "FILL") body.stdAnswers = stdAnswers.filter(a => a.answerText.trim());
      await api.put(`/api/questions/${id}`, body);
      setToast({ msg: "Question updated", type: "success" });
      setTimeout(() => router.push("/teacher/questions"), 800);
    } catch (err: unknown) {
      setToast({ msg: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed", type: "error" });
    } finally { setSaving(false); }
  }

  if (!user || loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>Loading…</div>
  );

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "2.5rem 2rem 5rem", maxWidth: "44rem", margin: "0 auto" }}>
        <header style={{ marginBottom: "2rem" }}>
          <p className="section-label" style={{ marginBottom: "0.375rem" }}>Question Bank</p>
          <h1 className="page-heading" style={{ margin: 0 }}>Edit Question #{id}</h1>
        </header>

        <form onSubmit={handleSubmit} className="card" style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Question Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="select-glass">
              <option value="SINGLE">Single Choice</option><option value="MULTIPLE">Multiple Choice</option><option value="TRUEFALSE">True / False</option><option value="FILL">Fill in Blank</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="select-glass">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))} className="select-glass">
                <option value={1}>⭐ Easy</option><option value={2}>⭐⭐ Medium</option><option value={3}>⭐⭐⭐ Hard</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Question Content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} required className="input-glass" style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={labelStyle}>Default Score</label>
            <input type="number" value={defaultScore} onChange={e => setDefaultScore(e.target.value)} step="0.5" min="0.5" className="input-glass" style={{ width: "6rem" }} />
          </div>
          <div>
            <label style={labelStyle}>Explanation</label>
            <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} className="input-glass" placeholder="Explain the correct answer…" style={{ width: "100%", boxSizing: "border-box" }} />
          </div>

          {["SINGLE", "MULTIPLE", "TRUEFALSE"].includes(type) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Options</label>
                {type !== "TRUEFALSE" && (
                  <button type="button" onClick={() => setOptions([...options, { label: String.fromCharCode(65 + options.length), content: "", isCorrect: false }])}
                    style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    + Add Option
                  </button>
                )}
              </div>
              {options.map((opt, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink-400)", width: "1.5rem", fontFamily: "'DM Sans', sans-serif" }}>{opt.label}</span>
                  <input value={opt.content} onChange={e => { const o = [...options]; o[i].content = e.target.value; setOptions(o); }}
                    placeholder={`Option ${opt.label}`} className="input-glass" style={{ flex: 1 }} />
                  <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
                    <input type={type === "MULTIPLE" ? "checkbox" : "radio"} name="correct" checked={opt.isCorrect}
                      onChange={() => { const o = [...options]; if (type === "MULTIPLE") o[i].isCorrect = !o[i].isCorrect; else o.forEach((x, j) => x.isCorrect = j === i); setOptions(o); }}
                      style={{ accentColor: "var(--amber-accent)" }} /> Correct
                  </label>
                  {options.length > 2 && (
                    <button type="button" onClick={() => { setOptions(options.filter((_, j) => j !== i).map((o, j) => ({ ...o, label: String.fromCharCode(65 + j) }))); }}
                      style={{ fontSize: "0.75rem", color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>Remove</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {type === "FILL" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Standard Answers</label>
                <button type="button" onClick={() => setStdAnswers([...stdAnswers, { answerText: "", matchMode: "CASE_INSENSITIVE" }])}
                  style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--amber-accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  + Add Answer
                </button>
              </div>
              {stdAnswers.map((ans, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <input value={ans.answerText} onChange={e => { const a = [...stdAnswers]; a[i].answerText = e.target.value; setStdAnswers(a); }}
                    placeholder="Correct answer" className="input-glass" style={{ flex: 1 }} />
                  <select value={ans.matchMode} onChange={e => { const a = [...stdAnswers]; a[i].matchMode = e.target.value; setStdAnswers(a); }}
                    className="select-glass" style={{ width: "auto", fontSize: "0.75rem" }}>
                    <option value="CASE_INSENSITIVE">Case Insensitive</option><option value="EXACT">Exact</option><option value="CONTAINS">Contains</option>
                  </select>
                  {stdAnswers.length > 1 && (
                    <button type="button" onClick={() => setStdAnswers(stdAnswers.filter((_, j) => j !== i))}
                      style={{ fontSize: "0.75rem", color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>Remove</button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary" style={{ width: "100%" }}>
            {saving ? "Saving…" : "Update Question"}
          </button>
        </form>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
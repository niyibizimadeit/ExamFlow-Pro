"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

interface Option { label: string; content: string; isCorrect: boolean; }
interface StdAns { answerText: string; matchMode: string; }

const labelSt: React.CSSProperties = {
  display: "block", fontSize: "0.75rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.12em",
  color: "var(--ink-400, #b8a18a)", marginBottom: "0.5rem",
  fontFamily: "'DM Sans', sans-serif",
};
const inputSt: React.CSSProperties = {
  display: "block", width: "100%", padding: "0.875rem 1rem",
  fontSize: "0.9375rem", borderRadius: "10px", outline: "none",
  border: "1.5px solid rgba(212,180,131,0.5)",
  background: "rgba(253,250,244,0.7)", color: "var(--ink-900)",
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "var(--amber-accent)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,115,42,0.12)";
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "rgba(212,180,131,0.5)";
  e.currentTarget.style.boxShadow = "none";
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
    Promise.all([api.get("/api/categories"), api.get(`/api/questions/${id}`)]).then(([catRes, qRes]) => {
      setCategories(catRes.data.data);
      const q = qRes.data.data;
      setContent(q.content); setType(q.type); setDifficulty(q.difficulty);
      setDefaultScore(String(q.defaultScore)); setExplanation(q.explanation || "");
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
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "44rem", margin: "0 auto" }}>

        <header style={{ marginBottom: "2.5rem" }}>
          <Link href="/teacher/questions" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none" }}>← Back to Questions</Link>
          <div style={{ marginTop: "0.875rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>Question Bank</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.75rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
              Edit Question
            </h1>
            <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>#{id}</p>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Type */}
            <div>
              <label style={labelSt}>Question Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputSt, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                <option value="SINGLE">Single Choice</option>
                <option value="MULTIPLE">Multiple Choice</option>
                <option value="TRUEFALSE">True / False</option>
                <option value="FILL">Fill in Blank</option>
              </select>
            </div>

            {/* Category + Difficulty */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelSt}>Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required style={{ ...inputSt, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))} style={{ ...inputSt, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value={1}>⭐ Easy</option>
                  <option value={2}>⭐⭐ Medium</option>
                  <option value={3}>⭐⭐⭐ Hard</option>
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label style={labelSt}>Question Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} required
                style={{ ...inputSt, resize: "vertical", lineHeight: 1.55 }}
                onFocus={onFocus as never} onBlur={onBlur as never} />
            </div>

            {/* Score */}
            <div>
              <label style={labelSt}>Default Score</label>
              <input type="number" value={defaultScore} onChange={e => setDefaultScore(e.target.value)}
                step="0.5" min="0.5" style={{ ...inputSt, width: "7rem" }} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Explanation */}
            <div>
              <label style={labelSt}>Explanation</label>
              <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2}
                placeholder="Explain the correct answer…"
                style={{ ...inputSt, resize: "vertical", lineHeight: 1.55 }}
                onFocus={onFocus as never} onBlur={onBlur as never} />
            </div>

            {/* Options */}
            {["SINGLE", "MULTIPLE", "TRUEFALSE"].includes(type) && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                  <label style={{ ...labelSt, marginBottom: 0 }}>Options</label>
                  {type !== "TRUEFALSE" && (
                    <button type="button"
                      onClick={() => setOptions([...options, { label: String.fromCharCode(65 + options.length), content: "", isCorrect: false }])}
                      style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--amber-accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      + Add Option
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {options.map((opt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink-400, #b8a18a)", width: "1.5rem", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{opt.label}</span>
                      <input value={opt.content} onChange={e => { const o = [...options]; o[i].content = e.target.value; setOptions(o); }}
                        placeholder={`Option ${opt.label}`} style={{ ...inputSt, flex: 1 }} onFocus={onFocus} onBlur={onBlur} />
                      <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", flexShrink: 0 }}>
                        <input type={type === "MULTIPLE" ? "checkbox" : "radio"} name="correct" checked={opt.isCorrect}
                          onChange={() => { const o = [...options]; if (type === "MULTIPLE") o[i].isCorrect = !o[i].isCorrect; else o.forEach((x, j) => x.isCorrect = j === i); setOptions(o); }}
                          style={{ accentColor: "var(--amber-accent)", width: "1rem", height: "1rem" }} />
                        Correct
                      </label>
                      {options.length > 2 && (
                        <button type="button"
                          onClick={() => setOptions(options.filter((_, j) => j !== i).map((o, j) => ({ ...o, label: String.fromCharCode(65 + j) })))}
                          style={{ fontSize: "0.875rem", color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fill answers */}
            {type === "FILL" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                  <label style={{ ...labelSt, marginBottom: 0 }}>Standard Answers</label>
                  <button type="button"
                    onClick={() => setStdAnswers([...stdAnswers, { answerText: "", matchMode: "CASE_INSENSITIVE" }])}
                    style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--amber-accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    + Add Answer
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {stdAnswers.map((ans, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <input value={ans.answerText} onChange={e => { const a = [...stdAnswers]; a[i].answerText = e.target.value; setStdAnswers(a); }}
                        placeholder="Correct answer" style={{ ...inputSt, flex: 1 }} onFocus={onFocus} onBlur={onBlur} />
                      <select value={ans.matchMode} onChange={e => { const a = [...stdAnswers]; a[i].matchMode = e.target.value; setStdAnswers(a); }}
                        style={{ ...inputSt, width: "auto", cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                        <option value="CASE_INSENSITIVE">Case Insensitive</option>
                        <option value="EXACT">Exact</option>
                        <option value="CONTAINS">Contains</option>
                      </select>
                      {stdAnswers.length > 1 && (
                        <button type="button" onClick={() => setStdAnswers(stdAnswers.filter((_, j) => j !== i))}
                          style={{ fontSize: "0.875rem", color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,180,131,0.4), transparent)" }} />

            {/* Submit */}
            <button type="submit" disabled={saving} style={{
              width: "100%", padding: "0.9375rem", borderRadius: "10px", border: "none",
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.55 : 1,
              fontSize: "0.9375rem", fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              color: "#fdf8f0",
              background: "linear-gradient(135deg, var(--amber-accent) 0%, #7a3318 100%)",
              boxShadow: "0 3px 12px rgba(181,115,42,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(181,115,42,0.36)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 3px 12px rgba(181,115,42,0.28)"; }}>
              {saving ? "Saving…" : "Update Question"}
            </button>
          </div>
        </form>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
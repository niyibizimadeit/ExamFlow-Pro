"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

interface Option { label: string; content: string; isCorrect: boolean; }
interface StdAns { answerText: string; matchMode: string; }

export default function NewQuestionPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState("SINGLE");
  const [difficulty, setDifficulty] = useState(1);
  const [defaultScore, setDefaultScore] = useState("2");
  const [explanation, setExplanation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [options, setOptions] = useState<Option[]>([{ label: "A", content: "", isCorrect: false }, { label: "B", content: "", isCorrect: false }]);
  const [stdAnswers, setStdAnswers] = useState<StdAns[]>([{ answerText: "", matchMode: "CASE_INSENSITIVE" }]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/categories").then(r => setCategories(r.data.data));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const body: Record<string, unknown> = { content, type, difficulty, defaultScore: parseFloat(defaultScore) || 2, explanation, categoryId: parseInt(categoryId) };
      if (["SINGLE", "MULTIPLE", "TRUEFALSE"].includes(type)) body.options = options.filter(o => o.content.trim());
      if (type === "FILL") body.stdAnswers = stdAnswers.filter(a => a.answerText.trim());
      await api.post("/api/questions", body);
      setToast({ msg: "Question created", type: "success" });
      setTimeout(() => router.push("/teacher/questions"), 800);
    } catch (err: unknown) {
      setToast({ msg: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed", type: "error" });
    } finally { setSaving(false); }
  }

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-3xl mx-auto">
        <h1 className="page-heading mb-8">Create Question</h1>
        <form onSubmit={handleSubmit} className="glass p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Question Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="select-glass">
              <option value="SINGLE">Single Choice</option><option value="MULTIPLE">Multiple Choice</option><option value="TRUEFALSE">True / False</option><option value="FILL">Fill in Blank</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="select-glass">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))} className="select-glass">
                <option value={1}>Easy</option><option value={2}>Medium</option><option value={3}>Hard</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} required className="input-glass" placeholder="Enter the question text..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Default Score</label>
            <input type="number" value={defaultScore} onChange={e => setDefaultScore(e.target.value)} step="0.5" min="0.5" className="input-glass w-32" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Explanation</label>
            <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} className="input-glass" placeholder="Explain the correct answer..." />
          </div>

          {["SINGLE", "MULTIPLE", "TRUEFALSE"].includes(type) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-600">Options</label>
                {type !== "TRUEFALSE" && <button type="button" onClick={() => setOptions([...options, { label: String.fromCharCode(65 + options.length), content: "", isCorrect: false }])} className="text-xs font-medium text-indigo-500 hover:text-indigo-600">Add Option</button>}
              </div>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-6">{opt.label}</span>
                  <input value={opt.content} onChange={e => { const o = [...options]; o[i].content = e.target.value; setOptions(o); }} placeholder={`Option ${opt.label}`} className="input-glass flex-1" />
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input type={type === "MULTIPLE" ? "checkbox" : "radio"} name="correct" checked={opt.isCorrect} onChange={() => { const o = [...options]; if (type === "MULTIPLE") o[i].isCorrect = !o[i].isCorrect; else o.forEach((x, j) => x.isCorrect = j === i); setOptions(o); }} /> Correct
                  </label>
                  {options.length > 2 && <button type="button" onClick={() => { setOptions(options.filter((_, j) => j !== i).map((o, j) => ({ ...o, label: String.fromCharCode(65 + j) }))); }} className="text-slate-400 hover:text-red-500 text-xs">Remove</button>}
                </div>
              ))}
            </div>
          )}

          {type === "FILL" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-600">Standard Answers</label>
                <button type="button" onClick={() => setStdAnswers([...stdAnswers, { answerText: "", matchMode: "CASE_INSENSITIVE" }])} className="text-xs font-medium text-indigo-500 hover:text-indigo-600">Add Answer</button>
              </div>
              {stdAnswers.map((ans, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input value={ans.answerText} onChange={e => { const a = [...stdAnswers]; a[i].answerText = e.target.value; setStdAnswers(a); }} placeholder="Correct answer" className="input-glass flex-1" />
                  <select value={ans.matchMode} onChange={e => { const a = [...stdAnswers]; a[i].matchMode = e.target.value; setStdAnswers(a); }} className="select-glass w-36 text-xs">
                    <option value="CASE_INSENSITIVE">Case Insensitive</option><option value="EXACT">Exact</option><option value="CONTAINS">Contains</option>
                  </select>
                  {stdAnswers.length > 1 && <button type="button" onClick={() => setStdAnswers(stdAnswers.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 text-xs">Remove</button>}
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Saving..." : "Create Question"}</button>
        </form>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

interface Option { label: string; content: string; isCorrect: boolean; }
interface StdAns { answerText: string; matchMode: string; }

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
      api.get(`/api/questions/${id}`)
    ]).then(([catRes, qRes]) => {
      setCategories(catRes.data.data);
      const q = qRes.data.data;
      setContent(q.content);
      setType(q.type);
      setDifficulty(q.difficulty);
      setDefaultScore(String(q.defaultScore));
      setExplanation(q.explanation || "");
      setCategoryId(String(q.categoryId));
      if (q.options?.length) {
        setOptions(q.options.map((o: Record<string, unknown>) => ({ label: o.label as string, content: o.content as string, isCorrect: o.isCorrect as boolean })));
      }
      if (q.stdAnswers?.length) {
        setStdAnswers(q.stdAnswers.map((a: Record<string, unknown>) => ({ answerText: a.answerText as string, matchMode: a.matchMode as string })));
      }
      setLoading(false);
    });
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = { content, type, difficulty, defaultScore: parseFloat(defaultScore) || 2, explanation, categoryId: parseInt(categoryId) };
      if (["SINGLE", "MULTIPLE", "TRUEFALSE"].includes(type)) {
        body.options = options.filter(o => o.content.trim());
      }
      if (type === "FILL") {
        body.stdAnswers = stdAnswers.filter(a => a.answerText.trim());
      }
      await api.put(`/api/questions/${id}`, body);
      setToast({ msg: "Question updated!", type: "success" });
      setTimeout(() => router.push("/teacher/questions"), 800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update";
      setToast({ msg, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (!user || loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Question #{id}</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full">
              <option value="SINGLE">Single Choice</option>
              <option value="MULTIPLE">Multiple Choice</option>
              <option value="TRUEFALSE">True/False</option>
              <option value="FILL">Fill-in-Blank</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))} className="border rounded-lg px-3 py-2 text-sm w-full">
                <option value={1}>⭐ Easy</option>
                <option value={2}>⭐⭐ Medium</option>
                <option value={3}>⭐⭐⭐ Hard</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} required className="border rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Score</label>
            <input type="number" value={defaultScore} onChange={e => setDefaultScore(e.target.value)} step="0.5" min="0.5" className="border rounded-lg px-3 py-2 text-sm w-32" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
            <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} className="border rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          {["SINGLE", "MULTIPLE", "TRUEFALSE"].includes(type) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Options</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-6">{opt.label}</span>
                  <input value={opt.content} onChange={e => { const o = [...options]; o[i].content = e.target.value; setOptions(o); }} className="border rounded-lg px-3 py-2 text-sm flex-1" />
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input type={type === "MULTIPLE" ? "checkbox" : "radio"} name="correct" checked={opt.isCorrect} onChange={() => {
                      const o = [...options];
                      if (type === "MULTIPLE") o[i].isCorrect = !o[i].isCorrect;
                      else o.forEach((x, j) => x.isCorrect = j === i);
                      setOptions(o);
                    }} /> Correct
                  </label>
                </div>
              ))}
            </div>
          )}
          {type === "FILL" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Standard Answers</label>
              {stdAnswers.map((ans, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input value={ans.answerText} onChange={e => { const a = [...stdAnswers]; a[i].answerText = e.target.value; setStdAnswers(a); }} className="border rounded-lg px-3 py-2 text-sm flex-1" />
                  <select value={ans.matchMode} onChange={e => { const a = [...stdAnswers]; a[i].matchMode = e.target.value; setStdAnswers(a); }} className="border rounded-lg px-2 py-2 text-xs w-36">
                    <option value="CASE_INSENSITIVE">Case Insensitive</option>
                    <option value="EXACT">Exact Match</option>
                    <option value="CONTAINS">Contains</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? "Saving…" : "Update Question"}
          </button>
        </form>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

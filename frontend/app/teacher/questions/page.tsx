"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

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
  const [toast, setToast] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/categories").then(r => setCategories(r.data.data));
  }, [router]);

  const fetch = useCallback(() => {
    const p = new URLSearchParams({ size: "10", page: String(page) });
    if (type) p.set("type", type);
    if (categoryId) p.set("categoryId", categoryId);
    if (difficulty) p.set("difficulty", difficulty);
    if (keyword) p.set("keyword", keyword);
    api.get(`/api/questions?${p}`).then(r => {
      setQuestions(r.data.data.content);
      setTotal(r.data.data.totalElements);
      setTotalPages(r.data.data.totalPages);
    });
  }, [page, type, categoryId, difficulty, keyword]);

  useEffect(() => { fetch(); }, [fetch]);

  async function del(id: number) {
    if (!confirm("Delete this question?")) return;
    try { await api.delete(`/api/questions/${id}`); setToast("Deleted"); fetch(); }
    catch { setToast("Cannot delete: question is in use"); }
  }

  const typeStyle = (t: string) => {
    const m: Record<string, string> = { SINGLE: "bg-blue-50 text-blue-700 border-blue-200", MULTIPLE: "bg-purple-50 text-purple-700 border-purple-200", TRUEFALSE: "bg-emerald-50 text-emerald-700 border-emerald-200", FILL: "bg-amber-50 text-amber-700 border-amber-200" };
    return m[t] || "bg-slate-50 text-slate-600 border-slate-200";
  };

  const inputClass = "px-3 py-2 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all";

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Question Bank</h1>
            <p className="text-slate-500 text-sm mt-1">{total} questions</p>
          </div>
          <div className="flex gap-3">
            <Link href="/teacher/questions/categories" className="px-4 py-2 rounded-xl border border-slate-200 bg-white/60 text-sm font-medium text-slate-600 hover:bg-white transition-colors">Categories</Link>
            <Link href="/teacher/questions/new" className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all">New Question</Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <input value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} placeholder="Search..." className={`${inputClass} w-48`} />
          <select value={type} onChange={e => { setType(e.target.value); setPage(0); }} className={`${inputClass} w-36`}>
            <option value="">All Types</option><option value="SINGLE">Single</option><option value="MULTIPLE">Multiple</option><option value="TRUEFALSE">T/F</option><option value="FILL">Fill</option>
          </select>
          <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(0); }} className={`${inputClass} w-40`}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(0); }} className={`${inputClass} w-32`}>
            <option value="">Any Level</option><option value="1">Easy</option><option value="2">Medium</option><option value="3">Hard</option>
          </select>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Question</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Level</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-slate-700 max-w-xs truncate">{q.content}</td>
                  <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeStyle(q.type)}`}>{q.type}</span></td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{q.categoryName}</td>
                  <td className="px-5 py-3.5 text-sm text-amber-500">
                    {Array.from({ length: q.difficulty }, (_, i) => <span key={i}>&#9679;</span>)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{q.defaultScore}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/teacher/questions/${q.id}/edit`} className="text-xs font-medium text-indigo-600 hover:text-indigo-500 mr-4">Edit</Link>
                    <button onClick={() => del(q.id)} className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-400">No questions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`min-w-[2.25rem] h-9 rounded-xl text-sm font-medium transition-all ${
                  page === i ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white/60 border border-slate-200 text-slate-600 hover:bg-white"
                }`}>{i + 1}</button>
            ))}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 text-sm text-slate-700 z-50">
            {toast}
            <button onClick={() => setToast("")} className="ml-3 text-slate-400 hover:text-slate-600">x</button>
          </div>
        )}
      </main>
    </>
  );
}

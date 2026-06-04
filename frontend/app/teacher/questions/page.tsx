"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

interface Question {
  id: number;
  content: string;
  type: string;
  difficulty: number;
  categoryName: string;
  defaultScore: number;
  createdAt: string;
}

export default function TeacherQuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/categories").then(r => setCategories(r.data.data));
  }, [router]);

  const fetchQuestions = useCallback(() => {
    const params = new URLSearchParams();
    params.set("size", "10");
    params.set("page", String(page));
    if (type) params.set("type", type);
    if (categoryId) params.set("categoryId", categoryId);
    if (difficulty) params.set("difficulty", difficulty);
    if (keyword) params.set("keyword", keyword);
    api.get(`/api/questions?${params}`).then(r => {
      setQuestions(r.data.data.content);
      setTotal(r.data.data.totalElements);
      setTotalPages(r.data.data.totalPages);
    });
  }, [page, type, categoryId, difficulty, keyword]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this question?")) return;
    try {
      await api.delete(`/api/questions/${id}`);
      setToast({ msg: "Question deleted", type: "success" });
      fetchQuestions();
    } catch {
      setToast({ msg: "Cannot delete: question is in use", type: "error" });
    }
  }

  const typeBadge = (t: string) => {
    const map: Record<string, string> = { SINGLE: "bg-blue-100 text-blue-700", MULTIPLE: "bg-purple-100 text-purple-700", TRUEFALSE: "bg-green-100 text-green-700", FILL: "bg-orange-100 text-orange-700" };
    return map[t] || "bg-gray-100";
  };

  const stars = (d: number) => "⭐".repeat(d);

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Question Bank</h1>
            <p className="text-gray-500 text-sm">{total} questions total</p>
          </div>
          <div className="flex gap-2">
            <Link href="/teacher/questions/categories" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Categories</Link>
            <Link href="/teacher/questions/new" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ New Question</Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} placeholder="Search keyword..." className="border rounded-lg px-3 py-1.5 text-sm w-48" />
          <select value={type} onChange={e => { setType(e.target.value); setPage(0); }} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Types</option>
            <option value="SINGLE">Single Choice</option>
            <option value="MULTIPLE">Multiple Choice</option>
            <option value="TRUEFALSE">True/False</option>
            <option value="FILL">Fill-in-Blank</option>
          </select>
          <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(0); }} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(0); }} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Difficulties</option>
            <option value="1">⭐ Easy</option>
            <option value="2">⭐⭐ Medium</option>
            <option value="3">⭐⭐⭐ Hard</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Question</th>
                <th className="px-4 py-3 text-left w-24">Type</th>
                <th className="px-4 py-3 text-left w-24">Category</th>
                <th className="px-4 py-3 text-left w-20">Difficulty</th>
                <th className="px-4 py-3 text-left w-16">Score</th>
                <th className="px-4 py-3 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {questions.map(q => (
                <tr key={q.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-800 truncate max-w-xs">{q.content}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge(q.type)}`}>{q.type}</span></td>
                  <td className="px-4 py-3 text-gray-500">{q.categoryName}</td>
                  <td className="px-4 py-3">{stars(q.difficulty)}</td>
                  <td className="px-4 py-3 text-gray-600">{q.defaultScore}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/teacher/questions/${q.id}/edit`} className="text-blue-600 hover:underline text-xs mr-3">Edit</Link>
                    <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No questions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`px-3 py-1 rounded text-sm ${page === i ? "bg-blue-600 text-white" : "bg-white border hover:bg-gray-50"}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

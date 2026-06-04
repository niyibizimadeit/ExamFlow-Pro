"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

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
  const [toast, setToast] = useState("");

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
    api.get(`/api/questions?${p}`).then(r => setQuestions(r.data.data.content));
  }, [keyword, type]);

  async function add(qId: number) {
    try { await api.post(`/api/papers/${id}/questions`, { questions: [{ questionId: qId, score: parseFloat(sc[qId] || "2") }] }); setToast("Added"); fetchPaper(); } catch { setToast("Failed"); }
  }
  async function remove(qId: number) {
    try { await api.delete(`/api/papers/${id}/questions/${qId}`); setToast("Removed"); fetchPaper(); } catch { setToast("Failed"); }
  }
  async function assemble() {
    try { await api.put(`/api/papers/${id}/rules`, rules); await api.post(`/api/papers/${id}/assemble`); setToast("Assembly complete"); fetchPaper(); }
    catch (err: unknown) { setToast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed"); }
  }
  async function publish() {
    if (!confirm("Once published, questions cannot be changed. Continue?")) return;
    try { await api.put(`/api/papers/${id}/publish`); setToast("Published"); fetchPaper(); }
    catch (err: unknown) { setToast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed"); }
  }

  const inp = "px-3 py-2 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all";

  if (!user || !paper) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  const isDraft = paper.status === "DRAFT";
  const total = paperQs.reduce((s, q) => s + q.score, 0);

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{paper.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{paper.questionCount} questions &middot; {total}/{paper.totalScore} pts &middot; <span className={paper.status === "PUBLISHED" ? "text-emerald-600 font-semibold" : "text-slate-400"}>{paper.status}</span></p>
          </div>
          {isDraft && <button onClick={publish} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">Publish</button>}
        </div>

        {isDraft && (
          <div className="flex gap-1 mb-6">
            {["manual", "assembly"].map(t => (
              <button key={t} onClick={() => setTab(t as "manual" | "assembly")}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>{t === "manual" ? "Manual Build" : "Rule Assembly"}</button>
            ))}
          </div>
        )}

        {tab === "manual" && (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-600 mb-4">Question Bank</h2>
              <div className="flex gap-2 mb-4">
                <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search..." className={`${inp} flex-1`} />
                <select value={type} onChange={e => setType(e.target.value)} className={`${inp} w-28`}><option value="">All</option><option value="SINGLE">Single</option><option value="MULTIPLE">Multi</option><option value="TRUEFALSE">T/F</option><option value="FILL">Fill</option></select>
              </div>
              <div className="space-y-1 max-h-[460px] overflow-y-auto">
                {questions.filter(q => !paperQs.some(p => p.questionId === q.id)).map(q => (
                  <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors">
                    <div className="flex-1 min-w-0"><p className="text-xs text-slate-700 truncate">{q.content}</p><span className="text-[10px] text-slate-400">{q.type} &middot; {q.categoryName}</span></div>
                    <input type="number" value={sc[q.id] || "2"} onChange={e => setSc({ ...sc, [q.id]: e.target.value })} className="w-16 text-center text-xs bg-white rounded-lg border border-slate-200 px-1.5 py-1" min="0.5" step="0.5" />
                    <button onClick={() => add(q.id)} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">Add</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-600 mb-4">Paper Questions ({paperQs.length})</h2>
              <div className="space-y-1 max-h-[460px] overflow-y-auto">
                {paperQs.map((pq, i) => (
                  <div key={pq.id} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/40">
                    <span className="text-xs font-bold text-slate-400 w-6">{i + 1}.</span>
                    <div className="flex-1 min-w-0"><p className="text-xs text-slate-700 truncate">{pq.questionContent}</p><span className="text-[10px] text-slate-400">{pq.questionType} &middot; {pq.score} pts</span></div>
                    {isDraft && <button onClick={() => remove(pq.questionId)} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Remove</button>}
                  </div>
                ))}
                {paperQs.length === 0 && <p className="text-center py-12 text-xs text-slate-400">No questions yet</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "assembly" && isDraft && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6 max-w-3xl">
            <h2 className="text-sm font-semibold text-slate-600 mb-1">Rule-Based Assembly</h2>
            <p className="text-xs text-slate-400 mb-5">Define rules and the system auto-selects questions. Existing questions will be replaced.</p>
            <div className="space-y-3 mb-5">
              {rules.map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50/60 rounded-xl px-4 py-2.5">
                  <select value={r.questionType} onChange={e => { const n = [...rules]; n[i].questionType = e.target.value; setRules(n); }} className={`${inp} w-28 text-xs`}><option value="SINGLE">Single</option><option value="MULTIPLE">Multiple</option><option value="TRUEFALSE">T/F</option><option value="FILL">Fill</option></select>
                  <select value={r.difficulty || ""} onChange={e => { const n = [...rules]; n[i].difficulty = e.target.value ? parseInt(e.target.value) : undefined; setRules(n); }} className={`${inp} w-32 text-xs`}><option value="">Any Level</option><option value="1">Easy</option><option value="2">Medium</option><option value="3">Hard</option></select>
                  <input type="number" value={r.count} onChange={e => { const n = [...rules]; n[i].count = parseInt(e.target.value) || 1; setRules(n); }} className="w-20 text-center text-xs bg-white rounded-lg border border-slate-200 px-1.5 py-1.5" placeholder="Count" />
                  <input type="number" value={r.scoreEach} onChange={e => { const n = [...rules]; n[i].scoreEach = parseFloat(e.target.value) || 1; setRules(n); }} className="w-20 text-center text-xs bg-white rounded-lg border border-slate-200 px-1.5 py-1.5" placeholder="Score" step="0.5" />
                  {rules.length > 1 && <button onClick={() => setRules(rules.filter((_, j) => j !== i))} className="text-xs text-slate-400 hover:text-red-500">Remove</button>}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRules([...rules, { questionType: "SINGLE", count: 5, scoreEach: 2 }])} className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white/60 text-slate-600 hover:bg-white transition-colors">Add Rule</button>
              <button onClick={assemble} className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all">Run Assembly</button>
            </div>
          </div>
        )}

        {toast && <div className="fixed bottom-6 right-6 bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 text-sm text-slate-700 z-50">{toast}<button onClick={() => setToast("")} className="ml-3 text-slate-400 hover:text-slate-600">x</button></div>}
      </main>
    </>
  );
}

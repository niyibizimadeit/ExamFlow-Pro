"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

interface Question { id: number; content: string; type: string; difficulty: number; categoryName: string; }
interface PaperQ { id: number; questionId: number; questionContent: string; questionType: string; difficulty: number; orderNum: number; score: number; }
interface Paper { id: number; title: string; status: string; totalScore: number; questionCount: number; questions?: PaperQ[]; }
interface AssemblyRule { questionType: string; categoryId?: number; difficulty?: number; count: number; scoreEach: number; }

export default function PaperBuildPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paperQs, setPaperQs] = useState<PaperQ[]>([]);
  const [tab, setTab] = useState<"manual" | "assembly">("manual");
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [scores, setScores] = useState<Record<number, string>>({});

  // Assembly rules state
  const [rules, setRules] = useState<AssemblyRule[]>([
    { questionType: "SINGLE", count: 10, scoreEach: 2 },
  ]);

  const fetchPaper = useCallback(() => {
    api.get(`/api/papers/${id}/preview`).then(r => {
      setPaper(r.data.data);
      setPaperQs(r.data.data.questions || []);
      const sc: Record<number, string> = {};
      (r.data.data.questions || []).forEach((q: PaperQ) => { sc[q.questionId] = String(q.score); });
      setScores(sc);
    });
  }, [id]);

  const searchQuestions = useCallback(() => {
    const params = new URLSearchParams();
    params.set("size", "20");
    if (keyword) params.set("keyword", keyword);
    if (type) params.set("type", type);
    api.get(`/api/questions?${params}`).then(r => setQuestions(r.data.data.content));
  }, [keyword, type]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    fetchPaper();
  }, [router, id, fetchPaper]);

  useEffect(() => { searchQuestions(); }, [searchQuestions]);

  async function handleAddQuestion(qId: number) {
    try {
      await api.post(`/api/papers/${id}/questions`, { questions: [{ questionId: qId, score: parseFloat(scores[qId] || "2") }] });
      setToast({ msg: "Question added", type: "success" });
      fetchPaper();
    } catch { setToast({ msg: "Failed to add question", type: "error" }); }
  }

  async function handleRemoveQuestion(qId: number) {
    try {
      await api.delete(`/api/papers/${id}/questions/${qId}`);
      setToast({ msg: "Question removed", type: "success" });
      fetchPaper();
    } catch { setToast({ msg: "Failed to remove", type: "error" }); }
  }

  async function handleAssemble() {
    try {
      // First save rules via update, then assemble
      await api.put(`/api/papers/${id}`, { assemblyRules: rules });
      await api.post(`/api/papers/${id}/assemble`);
      setToast({ msg: "Assembly complete!", type: "success" });
      fetchPaper();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Assembly failed";
      setToast({ msg, type: "error" });
    }
  }

  async function handlePublish() {
    if (!confirm("Once published, questions cannot be changed. Continue?")) return;
    try {
      await api.put(`/api/papers/${id}/publish`);
      setToast({ msg: "Paper published!", type: "success" });
      fetchPaper();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Publish failed";
      setToast({ msg, type: "error" });
    }
  }

  function updateRule(i: number, f: Partial<AssemblyRule>) {
    const r = [...rules];
    r[i] = { ...r[i], ...f };
    setRules(r);
  }
  function addRule() { setRules([...rules, { questionType: "SINGLE", count: 5, scoreEach: 2 }]); }
  function removeRule(i: number) { setRules(rules.filter((_, idx) => idx !== i)); }

  if (!user || !paper) return <div className="p-8 text-gray-500">Loading…</div>;

  const isDraft = paper.status === "DRAFT";
  const totalFromQuestions = paperQs.reduce((sum, q) => sum + q.score, 0);

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{paper.title}</h1>
            <p className="text-sm text-gray-500">
              {paper.questionCount} questions · {totalFromQuestions} / {paper.totalScore} pts ·
              <span className={paper.status === "PUBLISHED" ? "text-green-600 font-semibold" : "text-gray-400"}>{paper.status}</span>
            </p>
          </div>
          {isDraft && (
            <button onClick={handlePublish} className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
              Publish Paper
            </button>
          )}
        </div>

        {/* Tabs */}
        {isDraft && (
          <div className="flex gap-1 mb-4 border-b">
            <button onClick={() => setTab("manual")} className={`px-4 py-2 text-sm font-medium transition ${tab === "manual" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>Manual Build</button>
            <button onClick={() => setTab("assembly")} className={`px-4 py-2 text-sm font-medium transition ${tab === "assembly" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>Rule Assembly</button>
          </div>
        )}

        {/* MANUAL TAB */}
        {tab === "manual" && (
          <div className="grid grid-cols-2 gap-4">
            {/* Available questions */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Question Bank</h2>
              <div className="flex gap-2 mb-3">
                <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search..." className="border rounded-lg px-2 py-1.5 text-xs flex-1" />
                <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs">
                  <option value="">All</option>
                  <option value="SINGLE">Single</option>
                  <option value="MULTIPLE">Multiple</option>
                  <option value="TRUEFALSE">T/F</option>
                  <option value="FILL">Fill</option>
                </select>
              </div>
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {questions.filter(q => !paperQs.some(pq => pq.questionId === q.id)).map(q => (
                  <div key={q.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 truncate">{q.content}</p>
                      <span className="text-[10px] text-gray-400">{q.type} · {q.categoryName} · {"⭐".repeat(q.difficulty)}</span>
                    </div>
                    <input type="number" value={scores[q.id] || "2"} onChange={e => setScores({ ...scores, [q.id]: e.target.value })} className="w-14 border rounded px-1.5 py-0.5 text-xs" min="0.5" step="0.5" />
                    {isDraft && <button onClick={() => handleAddQuestion(q.id)} className="text-xs text-blue-600 hover:underline shrink-0">+ Add</button>}
                  </div>
                ))}
              </div>
            </div>

            {/* Paper questions */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Paper Questions ({paperQs.length})</h2>
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {paperQs.map((pq, i) => (
                  <div key={pq.id} className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 rounded-lg">
                    <span className="text-xs font-bold text-gray-400 w-6">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 truncate">{pq.questionContent}</p>
                      <span className="text-[10px] text-gray-400">{pq.questionType} · {"⭐".repeat(pq.difficulty)} · {pq.score} pts</span>
                    </div>
                    {isDraft && <button onClick={() => handleRemoveQuestion(pq.questionId)} className="text-xs text-red-400 hover:text-red-600">✕</button>}
                  </div>
                ))}
                {paperQs.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No questions added yet. Search and add from the bank.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ASSEMBLY TAB */}
        {tab === "assembly" && isDraft && (
          <div className="bg-white rounded-xl shadow-sm border p-6 max-w-3xl">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Rule-Based Assembly</h2>
            <p className="text-xs text-gray-400 mb-4">Define rules for automatic question selection. Existing questions will be replaced.</p>

            <div className="space-y-3 mb-4">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                  <select value={rule.questionType} onChange={e => updateRule(i, { questionType: e.target.value })} className="border rounded px-2 py-1.5 text-xs w-28">
                    <option value="SINGLE">Single</option>
                    <option value="MULTIPLE">Multiple</option>
                    <option value="TRUEFALSE">T/F</option>
                    <option value="FILL">Fill</option>
                  </select>
                  <select value={rule.difficulty || ""} onChange={e => updateRule(i, { difficulty: e.target.value ? parseInt(e.target.value) : undefined })} className="border rounded px-2 py-1.5 text-xs w-28">
                    <option value="">Any Difficulty</option>
                    <option value="1">⭐ Easy</option>
                    <option value="2">⭐⭐ Medium</option>
                    <option value="3">⭐⭐⭐ Hard</option>
                  </select>
                  <input type="number" value={rule.count} onChange={e => updateRule(i, { count: parseInt(e.target.value) || 1 })} className="border rounded px-2 py-1.5 text-xs w-20" placeholder="Count" min="1" />
                  <input type="number" value={rule.scoreEach} onChange={e => updateRule(i, { scoreEach: parseFloat(e.target.value) || 1 })} className="border rounded px-2 py-1.5 text-xs w-20" placeholder="Score" min="0.5" step="0.5" />
                  {rules.length > 1 && <button onClick={() => removeRule(i)} className="text-red-400 text-xs">✕</button>}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={addRule} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 transition">+ Add Rule</button>
              <button onClick={handleAssemble} className="px-5 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function PaperResultsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [scores, setScores] = useState<Record<string, unknown>[]>([]);
  const [paper, setPaper] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const p = decodeToken(token);
    if (!p || p.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: p.name, role: p.role });
    Promise.all([
      api.get(`/api/scores/stats/${id}`),
      api.get(`/api/scores/paper/${id}`),
      api.get(`/api/papers/${id}`),
    ]).then(([s, sc, p]) => { setStats(s.data.data); setScores(sc.data.data); setPaper(p.data.data); });
  }, [router, id]);

  if (!user || !stats) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  const dist = stats.distribution ? Object.entries(stats.distribution as Record<string, number>).map(([r, c]) => ({ range: r, count: c })) : [];
  const colors = ["#f87171", "#fb923c", "#60a5fa", "#34d399"];

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/teacher/papers" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Back to Papers</Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">{(paper?.title as string) || `Paper ${id}`} &mdash; Results</h1>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { label: "Average Score", value: stats.avg, color: "text-blue-600" },
            { label: "Highest Score", value: stats.max, color: "text-emerald-600" },
            { label: "Lowest Score", value: stats.min, color: "text-amber-600" },
            { label: "Pass Rate", value: `${Math.round(Number(stats.passRate || 0) * 100)}%`, color: "text-violet-600" },
          ].map(c => (
            <div key={c.label} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{String(c.value)}</p>
            </div>
          ))}
        </div>

        {dist.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-8">
            <h2 className="text-sm font-semibold text-slate-600 mb-4">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {dist.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-600 px-5 pt-5 pb-3">Student Results ({Number(stats.count || 0)})</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{String(s.studentName || `Student #${i + 1}`)}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{String(s.totalScore)} / {String(s.paperTotalScore)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.passed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {s.passed ? "Pass" : "Fail"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{String(s.gradedAt).split("T")[0]}</td>
                </tr>
              ))}
              {scores.length === 0 && <tr><td colSpan={4} className="px-5 py-16 text-center text-sm text-slate-400">No submissions yet</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

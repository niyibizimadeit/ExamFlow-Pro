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
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });

    Promise.all([
      api.get(`/api/scores/stats/${id}`),
      api.get(`/api/scores/paper/${id}`),
      api.get(`/api/papers/${id}`),
    ]).then(([sRes, scRes, pRes]) => {
      setStats(sRes.data.data);
      setScores(scRes.data.data);
      setPaper(pRes.data.data);
    });
  }, [router, id]);

  if (!user || !stats) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  const distData = stats.distribution ? Object.entries(stats.distribution as Record<string, number>).map(([range, count]) => ({ range, count })) : [];
  const avg = Number(stats.avg || 0);
  const max = Number(stats.max || 0);
  const min = Number(stats.min || 0);
  const passRate = Number(stats.passRate || 0);
  const count = Number(stats.count || 0);

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/teacher/papers" className="text-sm text-blue-600 hover:underline">← Back to Papers</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">{(paper?.title as string) || `Paper ${id}`} — Results</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Average Score", value: avg, color: "text-blue-600" },
            { label: "Highest Score", value: max, color: "text-green-600" },
            { label: "Lowest Score", value: min, color: "text-orange-600" },
            { label: "Pass Rate", value: `${Math.round(passRate * 100)}%`, color: "text-purple-600" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl shadow-sm border p-5">
              <p className="text-xs text-gray-400 uppercase">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Score Distribution Chart */}
        {distData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5 mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={distData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {distData.map((_, i) => (
                    <Cell key={i} fill={["#ef4444","#f59e0b","#3b82f6","#22c55e"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Student Results Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-700 px-5 pt-5 pb-3">Student Results ({count})</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Student</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Graded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {scores.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">Student #{i+1}</td>
                  <td className="px-5 py-3">{String(s.totalScore)} / {String(s.paperTotalScore)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {s.passed ? "PASS" : "FAIL"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{String(s.gradedAt).split("T")[0]}</td>
                </tr>
              ))}
              {scores.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No submissions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

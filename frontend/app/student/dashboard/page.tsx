"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

interface Paper { id: number; title: string; durationMins: number; totalScore: number; status: string; questionCount: number; }

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [scores, setScores] = useState<{ id: number; paperTitle: string; score: number; paperTotalScore: number; passed: boolean }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/papers").then(r => setPapers(r.data.data));
    api.get("/api/scores/my").then(r => setScores(r.data.data.map((s: Record<string, unknown>) => ({
      id: s.id, paperTitle: s.paperTitle, score: s.totalScore, paperTotalScore: s.paperTotalScore, passed: s.passed
    }))));
  }, [router]);

  if (!user) return null;

  const availablePapers = papers.filter(p => p.status === "PUBLISHED");
  const takenPaperIds = new Set(scores.map(s => s.paperTitle));

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Dashboard</h1>

        {/* Available Exams */}
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Available Exams</h2>
        <div className="grid gap-3 mb-8">
          {availablePapers.filter(p => !takenPaperIds.has(p.title)).map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{p.title}</h3>
                <p className="text-xs text-gray-400">{p.durationMins} min · {p.questionCount} questions · {p.totalScore} pts</p>
              </div>
              <Link href={`/student/exam/${p.id}`} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Start Exam</Link>
            </div>
          ))}
          {availablePapers.filter(p => !takenPaperIds.has(p.title)).length === 0 && (
            <p className="text-gray-400 text-sm py-4">No exams available right now.</p>
          )}
        </div>

        {/* My Results */}
        <h2 className="text-lg font-semibold text-gray-700 mb-3">My Results</h2>
        <div className="space-y-2">
          {scores.map(s => (
            <Link key={s.id} href={`/student/results/${s.id}`} className="block bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{s.paperTitle}</h3>
                  <p className="text-xs text-gray-400">Score: {s.score} / {s.paperTotalScore}</p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${s.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {s.passed ? "PASSED" : "FAILED"}
                </span>
              </div>
            </Link>
          ))}
          {scores.length === 0 && <p className="text-gray-400 text-sm py-4">No results yet.</p>}
        </div>
      </main>
    </>
  );
}

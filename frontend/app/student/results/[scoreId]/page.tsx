"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

interface AnswerDetail { questionId: number; questionContent: string; questionType: string; answerGiven: string; correctAnswer: string; isCorrect: boolean; scoreEarned: number; maxScore: number; explanation: string; }
interface ScoreDetail { id: number; sessionId: number; paperTitle: string; score: number; totalScore: number; passed: boolean; gradedAt: string; answers: AnswerDetail[]; }

export default function ResultDetailPage() {
  const router = useRouter();
  const { scoreId } = useParams<{ scoreId: string }>();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [detail, setDetail] = useState<ScoreDetail | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });

    api.get(`/api/scores/my`).then(r => {
      const scores = r.data.data;
      const score = scores.find((s: Record<string, unknown>) => s.id === parseInt(scoreId));
      if (score && score.sessionId) {
        api.get(`/api/scores/detail/${score.sessionId}`).then(r2 => setDetail(r2.data.data));
      }
    });
  }, [router, scoreId]);

  if (!user || !detail) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/student/dashboard" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">{detail.paperTitle}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={`text-lg font-bold ${detail.passed ? "text-green-600" : "text-red-600"}`}>
              {detail.score} / {detail.totalScore}
            </span>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${detail.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {detail.passed ? "PASSED" : "FAILED"}
            </span>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Question Breakdown</h2>
        <div className="space-y-3">
          {detail.answers.map((a, i) => (
            <div key={a.questionId} className={`bg-white rounded-xl shadow-sm border p-4 ${a.isCorrect ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-gray-800">{i + 1}. {a.questionContent}</p>
                <span className={`text-xs font-semibold ml-2 shrink-0 ${a.isCorrect ? "text-green-600" : "text-red-600"}`}>
                  {a.scoreEarned} / {a.maxScore}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>
                  <span className="text-gray-400">Your answer: </span>
                  <span className={a.isCorrect ? "text-green-600" : "text-red-600"}>{a.answerGiven || "(unanswered)"}</span>
                </div>
                {!a.isCorrect && (
                  <div>
                    <span className="text-gray-400">Correct: </span>
                    <span className="text-green-600">{a.correctAnswer}</span>
                  </div>
                )}
              </div>
              {a.explanation && (
                <p className="text-xs text-gray-400 mt-2 border-t pt-2">{a.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

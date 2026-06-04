"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

interface WrongAnswer { questionId: number; questionContent: string; questionType: string; answerGiven: string; correctAnswer: string; scoreEarned: number; maxScore: number; explanation: string; }

export default function WrongAnswersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/scores/wrong/all").then(r => setWrongAnswers(r.data.data));
  }, [router]);

  if (!user) return null;

  const typeBadge = (t: string) => {
    const m: Record<string, string> = { SINGLE: "bg-blue-100 text-blue-700", MULTIPLE: "bg-purple-100 text-purple-700", TRUEFALSE: "bg-green-100 text-green-700", FILL: "bg-orange-100 text-orange-700" };
    return m[t] || "bg-gray-100";
  };

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Wrong Answer Notebook</h1>
            <p className="text-gray-500 text-sm mt-1">You have {wrongAnswers.length} wrong answers to review</p>
          </div>
          <Link href="/student/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        </div>

        {wrongAnswers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-500">No wrong answers! Great job!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wrongAnswers.map((a, i) => (
              <div key={`${a.questionId}-${i}`} className="bg-white rounded-xl shadow-sm border border-l-4 border-l-red-500 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge(a.questionType)}`}>{a.questionType}</span>
                      <span className="text-xs text-gray-400">{a.scoreEarned}/{a.maxScore} pts</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{a.questionContent}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="text-gray-400">Your answer: </span>
                    <span className="text-red-600 font-medium">{a.answerGiven || "(unanswered)"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Correct answer: </span>
                    <span className="text-green-600 font-medium">{a.correctAnswer}</span>
                  </div>
                </div>

                {a.explanation && (
                  <details className="mt-3">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:underline">Show explanation</summary>
                    <p className="text-xs text-gray-500 mt-2 p-3 bg-blue-50 rounded-lg">{a.explanation}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

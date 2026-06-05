"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [papers, setPapers] = useState<{
    id: number; title: string; durationMins: number;
    totalScore: number; status: string; questionCount: number;
  }[]>([]);
  const [scores, setScores] = useState<{
    id: number; sessionId: number; paperId: number; paperTitle: string;
    totalScore: number; paperTotalScore: number; passed: boolean;
  }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/papers")
      .then(r => setPapers((r.data.data || []).filter((p: { status: string }) => p.status === "PUBLISHED")))
      .catch(() => setPapers([]));
    api.get("/api/scores/my")
      .then(r => setScores(r.data.data || []))
      .catch(() => setScores([]));
  }, [router]);

  if (!user) return null;

  const takenIds = new Set(scores.map(s => s.paperId));
  const available = papers.filter(p => !takenIds.has(p.id));

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />

      <main className="px-6 py-10 max-w-3xl mx-auto animate-fade-in">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="page-heading">Student Portal</h1>
          <p className="page-subheading">Available exams and your results</p>
        </div>

        {/* Available exams */}
        <section className="mb-12">
          <p className="section-label mb-5">Available Exams</p>

          <div className="space-y-3">
            {available.map((p, i) => (
              <div
                key={p.id}
                className="card p-5 flex items-center justify-between animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div>
                  <h3
                    className="font-display text-xl font-light"
                    style={{ color: "var(--ink-900)" }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--ink-300)" }}>
                    {p.durationMins} min &middot; {p.questionCount} questions &middot; {p.totalScore} pts
                  </p>
                </div>
                <Link href={`/student/exam/${p.id}`} className="btn-primary">
                  Begin Exam
                </Link>
              </div>
            ))}

            {available.length === 0 && (
              <div
                className="card p-10 text-center animate-fade-in"
                style={{ color: "var(--ink-300)" }}
              >
                <svg className="w-8 h-8 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No exams available right now</p>
              </div>
            )}
          </div>
        </section>

        <hr className="divider" />

        {/* Results */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <p className="section-label">Your Results</p>
            <Link
              href="/student/wrong-answers"
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--amber-accent)" }}
            >
              Wrong Answer Notebook
            </Link>
          </div>

          <div className="space-y-2">
            {scores.map((s, i) => (
              <Link
                key={s.id}
                href={`/student/results/${s.id}`}
                className="card p-4 flex items-center justify-between group block animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div>
                  <h3
                    className="font-display text-lg font-light transition-colors"
                    style={{ color: "var(--ink-900)" }}
                  >
                    {s.paperTitle}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-300)" }}>
                    {s.totalScore} / {s.paperTotalScore} points
                  </p>
                </div>
                <span className={s.passed ? "badge-pass" : "badge-fail"}>
                  {s.passed ? "Passed" : "Failed"}
                </span>
              </Link>
            ))}

            {scores.length === 0 && (
              <div
                className="card p-10 text-center animate-fade-in"
                style={{ color: "var(--ink-300)" }}
              >
                <svg className="w-8 h-8 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No completed exams yet</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </>
  );
}
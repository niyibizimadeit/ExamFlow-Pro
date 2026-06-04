"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

interface Paper {
  id: number; title: string; status: string; durationMins: number;
  totalScore: number; questionCount: number; createdAt: string;
}

export default function PapersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/papers").then(r => setPapers(r.data.data));
  }, [router]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-600", PUBLISHED: "bg-green-100 text-green-700", ENDED: "bg-red-100 text-red-600"
    };
    return map[s] || "bg-gray-100";
  };

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Papers</h1>
          <Link href="/teacher/papers/new" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ New Paper</Link>
        </div>

        <div className="grid gap-4">
          {papers.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-800">{p.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>{p.status}</span>
                </div>
                <p className="text-xs text-gray-400">{p.durationMins} min · {p.totalScore} pts · {p.questionCount} questions</p>
              </div>
              <div className="flex gap-2">
                {p.status === "DRAFT" && (
                  <Link href={`/teacher/papers/${p.id}/build`} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">Build</Link>
                )}
                <Link href={`/teacher/papers/${p.id}/build`} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 transition">View</Link>
              </div>
            </div>
          ))}
          {papers.length === 0 && <p className="text-center text-gray-400 py-12">No papers yet. Create your first exam paper!</p>}
        </div>
      </main>
    </>
  );
}

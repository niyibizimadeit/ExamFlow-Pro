"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
  }, [router]);

  if (!user) return null;

  const cards = [
    { label: "Question Bank", desc: "Manage questions & categories", href: "/teacher/questions", color: "bg-blue-500" },
    { label: "Exam Papers", desc: "Create & build exam papers", href: "/teacher/papers", color: "bg-green-500" },
    { label: "Score Analysis", desc: "View student results", href: "#", color: "bg-purple-500" },
  ];

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8">
        <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your question bank and exam papers.</p>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {cards.map(c => (
            <Link key={c.label} href={c.href} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition group">
              <div className={`w-10 h-10 rounded-lg ${c.color} mb-3 flex items-center justify-center text-white text-lg`}>
                {c.label === "Question Bank" ? "?" : c.label === "Exam Papers" ? "?" : "?"}
              </div>
              <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">{c.label}</p>
              <p className="text-sm text-gray-400 mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

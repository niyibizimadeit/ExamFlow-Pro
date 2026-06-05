"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import NavBar from "@/components/NavBar";

const IconQuestionBank = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconPapers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconResults = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const modules = [
  {
    label: "Question Bank",
    desc: "Create and manage questions across all types and categories",
    href: "/teacher/questions",
    iconBg: "linear-gradient(135deg, rgba(212,180,131,0.35) 0%, rgba(181,115,42,0.22) 100%)",
    iconColor: "var(--amber-accent)",
    Icon: IconQuestionBank,
  },
  {
    label: "Exam Papers",
    desc: "Build exam papers with manual selection or rule-based assembly",
    href: "/teacher/papers",
    iconBg: "linear-gradient(135deg, rgba(134,168,102,0.28) 0%, rgba(74,110,48,0.18) 100%)",
    iconColor: "#4a6e30",
    Icon: IconPapers,
  },
  {
    label: "Results",
    desc: "View student scores, statistics, and performance charts",
    href: "/teacher/papers",
    iconBg: "linear-gradient(135deg, rgba(168,84,56,0.22) 0%, rgba(122,51,24,0.15) 100%)",
    iconColor: "var(--terracotta)",
    Icon: IconResults,
  },
];

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

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="px-6 py-10 max-w-4xl mx-auto animate-fade-in">

        {/* Header */}
        <div className="mb-10">
          <p style={{
            fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.16em", color: "var(--ink-300)",
            fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem",
          }}>
            Teacher Workspace
          </p>
          <h1 className="font-display" style={{
            fontSize: "2.25rem", fontWeight: 300, letterSpacing: "-0.02em",
            color: "var(--ink-900)", lineHeight: 1.15,
          }}>
            Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", marginTop: "0.5rem" }}>
            Manage questions, exams, and view student performance
          </p>
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          {modules.map((m) => (
            <Link key={m.label} href={m.href} className="card p-6 group block">
              <div
                style={{
                  width: "2.75rem", height: "2.75rem", borderRadius: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1.25rem", flexShrink: 0,
                  background: m.iconBg,
                  boxShadow: "0 2px 8px rgba(181,115,42,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
                  transition: "transform 0.2s ease",
                  color: m.iconColor,
                }}
              >
                <m.Icon />
              </div>
              <h3 className="font-display" style={{
                fontSize: "1.25rem", fontWeight: 300, letterSpacing: "-0.01em",
                color: "var(--ink-900)", marginBottom: "0.375rem",
              }}>
                {m.label}
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-300)", lineHeight: 1.6 }}>
                {m.desc}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
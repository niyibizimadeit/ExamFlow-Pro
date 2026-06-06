"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import NavBar from "@/components/NavBar";

const modules = [
  {
    label: "Question Bank",
    desc: "Create and manage questions across all types and categories",
    href: "/teacher/questions",
    bg: "linear-gradient(135deg, rgba(212,180,131,0.35) 0%, rgba(181,115,42,0.22) 100%)",
    iconColor: "var(--amber-accent)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Exam Papers",
    desc: "Build exam papers with manual selection or rule-based assembly",
    href: "/teacher/papers",
    bg: "linear-gradient(135deg, rgba(134,168,102,0.28) 0%, rgba(74,110,48,0.18) 100%)",
    iconColor: "#4a6e30",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Results",
    desc: "View student scores, statistics, and performance breakdowns",
    href: "/teacher/papers",
    bg: "linear-gradient(135deg, rgba(168,84,56,0.22) 0%, rgba(122,51,24,0.15) 100%)",
    iconColor: "var(--terracotta)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
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
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "56rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>
            Teacher Workspace
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.75rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
            Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
            Manage questions, build exams, and review student performance
          </p>
        </header>

        {/* Module cards */}
        <div className="animate-slide-up" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {modules.map(m => (
            <Link key={m.label} href={m.href} style={{ textDecoration: "none" }}>
              <div className="card" style={{ padding: "2rem 1.75rem", height: "100%", boxSizing: "border-box" }}>
                {/* Icon */}
                <div style={{
                  width: "3.25rem", height: "3.25rem", borderRadius: "14px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1.5rem", background: m.bg,
                  boxShadow: "0 3px 12px rgba(181,115,42,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
                  color: m.iconColor,
                }}>
                  {m.icon}
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 400, letterSpacing: "-0.01em", color: "var(--ink-900)", marginBottom: "0.625rem", lineHeight: 1.2 }}>
                  {m.label}
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--ink-400, #b8a18a)", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", marginBottom: "1.25rem" }}>
                  {m.desc}
                </p>
                <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--amber-accent)", fontFamily: "'DM Sans', sans-serif" }}>
                  Open →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
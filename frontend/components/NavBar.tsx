"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearToken } from "@/lib/auth";

const navLinks: Record<string, { label: string; href: string }[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Users",     href: "/admin/users" },
  ],
  TEACHER: [
    { label: "Dashboard", href: "/teacher/dashboard" },
    { label: "Questions", href: "/teacher/questions" },
    { label: "Papers",    href: "/teacher/papers" },
  ],
  STUDENT: [
    { label: "Dashboard",     href: "/student/dashboard" },
    { label: "Wrong Answers", href: "/student/wrong-answers" },
    { label: "Profile",       href: "/student/profile" },
  ],
};

export default function NavBar({ fullName, role }: { fullName: string; role: string }) {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  const links = navLinks[role] || [];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 40,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1.5rem", height: "3.25rem",
      background: "rgba(249,242,227,0.90)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(212,180,131,0.35)",
      boxShadow: "0 1px 12px rgba(28,22,18,0.05)",
    }}>

      {/* Left: logo + role badge + nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link
          href={`/${role.toLowerCase()}/dashboard`}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.25rem", fontWeight: 300,
            letterSpacing: "-0.01em", color: "var(--ink-900)",
            textDecoration: "none",
          }}
        >
          ExamFlow
        </Link>

        <span style={{
          fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.625rem",
          borderRadius: "9999px", fontFamily: "'DM Sans', sans-serif",
          background: "rgba(181,115,42,0.10)", color: "var(--amber-accent)",
          border: "1px solid rgba(181,115,42,0.25)",
        }}>
          {role.charAt(0) + role.slice(1).toLowerCase()}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "0.125rem", marginLeft: "0.25rem" }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: "0.8125rem", fontWeight: 400, padding: "0.375rem 0.75rem",
                borderRadius: "7px", color: "var(--ink-500)",
                textDecoration: "none", transition: "all 0.12s ease",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(212,180,131,0.18)";
                e.currentTarget.style.color = "var(--ink-700)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ink-500)";
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: name + divider + sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif" }}>
          {fullName}
        </span>
        <div style={{ width: "1px", height: "1.125rem", background: "var(--ink-100)" }} />
        <button
          onClick={handleLogout}
          style={{
            fontSize: "0.875rem", fontWeight: 400, color: "var(--ink-300)",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", padding: 0,
            transition: "color 0.12s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
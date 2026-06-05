"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearToken } from "@/lib/auth";

const navLinks: Record<string, { label: string; href: string }[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Users", href: "/admin/users" },
  ],
  TEACHER: [
    { label: "Dashboard", href: "/teacher/dashboard" },
    { label: "Questions", href: "/teacher/questions" },
    { label: "Papers", href: "/teacher/papers" },
  ],
  STUDENT: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Wrong Answers", href: "/student/wrong-answers" },
    { label: "Profile", href: "/student/profile" },
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
    <nav
      className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
      style={{
        background: "rgba(249, 242, 227, 0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(212, 180, 131, 0.35)",
        boxShadow: "0 1px 12px rgba(28, 22, 18, 0.05)",
      }}
    >
      <div className="flex items-center gap-5">
        <Link
          href={`/${role.toLowerCase()}/dashboard`}
          className="font-display text-xl font-light tracking-tight transition-colors"
          style={{ color: "var(--ink-900)" }}
        >
          ExamFlow
        </Link>

        <span className="badge-role">
          {role.charAt(0) + role.slice(1).toLowerCase()}
        </span>

        <div className="flex items-center gap-0.5 ml-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="btn-ghost text-xs"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium" style={{ color: "var(--ink-500)" }}>
          {fullName}
        </span>
        <div className="w-px h-4" style={{ background: "var(--ink-100)" }} />
        <button
          onClick={handleLogout}
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--ink-300)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
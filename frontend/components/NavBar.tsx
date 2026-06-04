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

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-50 text-red-700 border-red-200",
    TEACHER: "bg-indigo-50 text-indigo-700 border-indigo-200",
    STUDENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const links = navLinks[role] || [];

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <Link href={`/${role.toLowerCase()}/dashboard`} className="text-lg font-bold text-slate-800 tracking-tight hover:text-indigo-600 transition-colors">
          ExamFlow
        </Link>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleColors[role] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
          {role.charAt(0) + role.slice(1).toLowerCase()}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-600">{fullName}</span>
        <div className="w-px h-5 bg-slate-200" />
        <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-red-500 font-medium transition-colors">
          Sign out
        </button>
      </div>
    </nav>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearToken } from "@/lib/auth";

interface NavBarProps {
  fullName: string;
  role: string;
}

export default function NavBar({ fullName, role }: NavBarProps) {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  const roleStyle =
    role === "ADMIN"   ? "badge badge-danger" :
    role === "TEACHER" ? "badge badge-info" :
                         "badge badge-success";

  return (
    <nav className="glass-nav sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href={`/${role.toLowerCase()}/dashboard`} className="text-lg font-bold text-slate-800 tracking-tight hover:text-indigo-600 transition-colors">
          ExamFlow
        </Link>
        <span className={roleStyle}>{role.charAt(0) + role.slice(1).toLowerCase()}</span>
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

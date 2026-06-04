"use client";

// components/NavBar.tsx — Top navigation bar with user info and logout

import { useRouter } from "next/navigation";
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

  const roleBadge =
    role === "ADMIN"   ? "bg-red-100 text-red-700" :
    role === "TEACHER" ? "bg-blue-100 text-blue-700" :
                         "bg-green-100 text-green-700";

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold text-blue-600">ExamFlow Pro</h1>
      <div className="flex items-center gap-4">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleBadge}`}>
          {role}
        </span>
        <span className="text-sm text-gray-700">{fullName}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

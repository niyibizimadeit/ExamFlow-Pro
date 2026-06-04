"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [users, setUsers] = useState<{ id: number; username: string; email: string; fullName: string; role: string; enabled: boolean; createdAt: string }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "ADMIN") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/admin/users").then(r => setUsers(r.data.data));
  }, [router]);

  if (!user) return null;

  const roleStyle = (r: string) => {
    if (r === "ADMIN") return "bg-red-50 text-red-700 border-red-200";
    if (r === "TEACHER") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h1>
            <p className="text-slate-500 text-sm mt-1">{users.length} users</p>
          </div>
          <Link href="/admin/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Dashboard</Link>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{u.fullName}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                  <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleStyle(u.role)}`}>{u.role}</span></td>
                  <td className="px-5 py-3.5 text-sm"><span className={u.enabled ? "text-emerald-600" : "text-red-500"}>{u.enabled ? "Active" : "Disabled"}</span></td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{String(u.createdAt).split("T")[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

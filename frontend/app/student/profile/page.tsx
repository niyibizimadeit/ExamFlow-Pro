"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [fullName, setFullName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [className, setClassName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/auth/me").then(r => {
      const p = r.data.data;
      setProfile(p);
      setFullName((p.fullName as string) || "");
      setStudentNo((p.studentNo as string) || "");
      setClassName((p.className as string) || "");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const body: Record<string, unknown> = { fullName, studentNo, className: className };
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setToast({ msg: "Passwords do not match", type: "error" });
          setSaving(false);
          return;
        }
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      await api.put("/api/auth/me", body);
      setToast({ msg: "Profile updated", type: "success" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) {
      setToast({ msg: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed", type: "error" });
    } finally { setSaving(false); }
  }

  if (!user || !profile) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all";

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Profile</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your personal information</p>
          </div>
          <Link href="/student/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Dashboard</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
            <input type="email" value={(profile.email as string) || ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Student No</label>
              <input value={studentNo} onChange={e => setStudentNo(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Class</label>
              <input value={className} onChange={e => setClassName(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Change Password</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

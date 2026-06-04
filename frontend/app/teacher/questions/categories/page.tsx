"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function CategoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; description: string }[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const p = decodeToken(token);
    if (!p || p.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: p.name, role: p.role });
    api.get("/api/categories").then(r => setCategories(r.data.data));
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try { await api.post("/api/categories", { name, description: desc }); setName(""); setDesc(""); setToast("Created"); api.get("/api/categories").then(r => setCategories(r.data.data)); }
    catch { setToast("Failed"); }
  }
  async function del(id: number) {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/api/categories/${id}`); setToast("Deleted"); api.get("/api/categories").then(r => setCategories(r.data.data)); }
    catch { setToast("Cannot delete"); }
  }

  const inp = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all";

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-6">Category Management</h1>

        <form onSubmit={create} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-4 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required className={inp} placeholder="e.g. Data Structures" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className={inp} placeholder="Optional" />
          </div>
          <button type="submit" className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all shrink-0">Create</button>
        </form>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm divide-y divide-slate-100">
          {categories.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
              </div>
              <button onClick={() => del(c.id)} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Delete</button>
            </div>
          ))}
          {categories.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-400">No categories yet.</p>}
        </div>

        {toast && <div className="fixed bottom-6 right-6 bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 text-sm text-slate-700 z-50">{toast}<button onClick={() => setToast("")} className="ml-3 text-slate-400 hover:text-slate-600">x</button></div>}
      </main>
    </>
  );
}

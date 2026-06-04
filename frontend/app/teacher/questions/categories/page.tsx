"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

export default function CategoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; description: string }[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    fetchCategories();
  }, [router]);

  function fetchCategories() { api.get("/api/categories").then(r => setCategories(r.data.data)); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/api/categories", { name, description: desc });
      setName(""); setDesc("");
      setToast({ msg: "Category created", type: "success" });
      fetchCategories();
    } catch {
      setToast({ msg: "Failed to create category", type: "error" });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    try {
      await api.delete(`/api/categories/${id}`);
      setToast({ msg: "Category deleted", type: "success" });
      fetchCategories();
    } catch {
      setToast({ msg: "Cannot delete category", type: "error" });
    }
  }

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Category Management</h1>

        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="e.g. Data Structures" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Optional" />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition shrink-0">Create</button>
        </form>

        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {categories.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{c.name}</p>
                {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
            </div>
          ))}
          {categories.length === 0 && <p className="px-4 py-6 text-center text-gray-400 text-sm">No categories yet.</p>}
        </div>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

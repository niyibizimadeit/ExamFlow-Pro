"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.6875rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.10em",
  color: "var(--ink-400)", marginBottom: "0.375rem",
  fontFamily: "'DM Sans', sans-serif",
};

export default function CategoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; description: string }[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const p = decodeToken(token);
    if (!p || p.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: p.name, role: p.role });
    api.get("/api/categories").then(r => setCategories(r.data.data || []));
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setAdding(true);
    try {
      await api.post("/api/categories", { name, description: desc });
      setName(""); setDesc("");
      setToast({ msg: "Category created", type: "success" });
      api.get("/api/categories").then(r => setCategories(r.data.data || []));
    } catch { setToast({ msg: "Failed to create", type: "error" }); }
    finally { setAdding(false); }
  }

  async function del(cid: number) {
    if (!confirm("Delete this category?")) return;
    try { await api.delete(`/api/categories/${cid}`); setToast({ msg: "Deleted", type: "success" }); api.get("/api/categories").then(r => setCategories(r.data.data || [])); }
    catch { setToast({ msg: "Cannot delete: category may be in use", type: "error" }); }
  }

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "2.5rem 2rem 5rem", maxWidth: "44rem", margin: "0 auto" }}>
        <header style={{ marginBottom: "2rem" }}>
          <p className="section-label" style={{ marginBottom: "0.375rem" }}>Question Bank</p>
          <h1 className="page-heading" style={{ margin: 0 }}>Category Management</h1>
        </header>

        <form onSubmit={create} className="card animate-slide-up" style={{ padding: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="input-glass" placeholder="e.g. Data Structures" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="input-glass" placeholder="Optional" />
          </div>
          <button type="submit" disabled={adding} className="btn-primary" style={{ flexShrink: 0 }}>
            {adding ? "Creating…" : "Create"}
          </button>
        </form>

        <div className="card animate-slide-up" style={{ overflow: "hidden" }}>
          {categories.length > 0 ? (
            categories.map(c => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid rgba(212,180,131,0.1)",
              }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--ink-700)", fontFamily: "'DM Sans', sans-serif" }}>{c.name}</p>
                  {c.description && <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginTop: "0.125rem", fontFamily: "'DM Sans', sans-serif" }}>{c.description}</p>}
                </div>
                <button onClick={() => del(c.id)}
                  style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ink-300)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>Delete</button>
              </div>
            ))
          ) : (
            <div style={{ padding: "3rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif" }}>
              No categories yet. Create one above.
            </div>
          )}
        </div>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
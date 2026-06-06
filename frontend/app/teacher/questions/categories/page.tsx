"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

const inputSt: React.CSSProperties = {
  display: "block", width: "100%", padding: "0.875rem 1rem",
  fontSize: "0.9375rem", borderRadius: "10px", outline: "none",
  border: "1.5px solid rgba(212,180,131,0.5)",
  background: "rgba(253,250,244,0.7)", color: "var(--ink-900)",
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};
const labelSt: React.CSSProperties = {
  display: "block", fontSize: "0.75rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.12em",
  color: "var(--ink-400, #b8a18a)", marginBottom: "0.5rem",
  fontFamily: "'DM Sans', sans-serif",
};
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "var(--amber-accent)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,115,42,0.12)";
};
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "rgba(212,180,131,0.5)";
  e.currentTarget.style.boxShadow = "none";
};

export default function CategoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; description: string }[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const reload = () => api.get("/api/categories").then(r => setCategories(r.data.data || []));

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const p = decodeToken(token);
    if (!p || p.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: p.name, role: p.role });
    reload();
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setAdding(true);
    try {
      await api.post("/api/categories", { name, description: desc });
      setName(""); setDesc("");
      setToast({ msg: "Category created", type: "success" });
      reload();
    } catch { setToast({ msg: "Failed to create", type: "error" }); }
    finally { setAdding(false); }
  }

  async function del(cid: number) {
    if (!confirm("Delete this category?")) return;
    try { await api.delete(`/api/categories/${cid}`); setToast({ msg: "Deleted", type: "success" }); reload(); }
    catch { setToast({ msg: "Cannot delete: category may be in use", type: "error" }); }
  }

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "44rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "2.5rem" }}>
          <Link href="/teacher/questions" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none" }}>← Back to Questions</Link>
          <div style={{ marginTop: "0.875rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>Question Bank</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.75rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
              Categories
            </h1>
            <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
            </p>
          </div>
        </header>

        {/* Create form */}
        <form onSubmit={create}>
          <div className="card animate-slide-up" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "1.25rem" }}>
              New Category
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={labelSt}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="e.g. Data Structures"
                  style={inputSt} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={labelSt}>Description</label>
                <input value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Optional"
                  style={inputSt} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
            <button type="submit" disabled={adding} style={{
              padding: "0.75rem 1.75rem", borderRadius: "10px", border: "none",
              cursor: adding ? "not-allowed" : "pointer", opacity: adding ? 0.55 : 1,
              fontSize: "0.9375rem", fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              color: "#fdf8f0",
              background: "linear-gradient(135deg, var(--amber-accent) 0%, #7a3318 100%)",
              boxShadow: "0 3px 12px rgba(181,115,42,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "transform 0.15s ease",
            }}
              onMouseEnter={e => { if (!adding) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
              {adding ? "Creating…" : "Create Category"}
            </button>
          </div>
        </form>

        {/* Category list */}
        <div className="card animate-slide-up" style={{ overflow: "hidden", padding: 0 }}>
          {categories.length > 0 ? (
            categories.map((c, i) => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "1.125rem 1.5rem",
                borderBottom: i < categories.length - 1 ? "1px solid rgba(212,180,131,0.14)" : "none",
                transition: "background 0.12s ease",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,180,131,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--ink-700)", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                    {c.name}
                  </p>
                  {c.description && (
                    <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", marginTop: "0.2rem", fontFamily: "'DM Sans', sans-serif", margin: "0.2rem 0 0" }}>
                      {c.description}
                    </p>
                  )}
                </div>
                <button onClick={() => del(c.id)} style={{
                  fontSize: "0.875rem", fontWeight: 500, color: "var(--ink-300)",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                  transition: "color 0.12s ease",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--terracotta)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-300)")}>
                  Delete
                </button>
              </div>
            ))
          ) : (
            <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-200, #e0d0c0)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", display: "block" }}>
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", fontFamily: "'DM Sans', sans-serif" }}>No categories yet</p>
              <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", marginTop: "0.375rem", fontFamily: "'DM Sans', sans-serif" }}>Create one above to organise your questions</p>
            </div>
          )}
        </div>

      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
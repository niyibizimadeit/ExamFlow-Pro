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
  color: "var(--ink-400)", marginBottom: "0.5rem",
  fontFamily: "'DM Sans', sans-serif",
};

export default function NewPaperPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMins, setDurationMins] = useState("60");
  const [totalScore, setTotalScore] = useState("100");
  const [passScore, setPassScore] = useState("60");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const body: Record<string, unknown> = { title, description, durationMins: parseInt(durationMins), totalScore: parseFloat(totalScore), passScore: parseFloat(passScore) };
      if (startTime) body.startTime = startTime;
      if (endTime) body.endTime = endTime;
      const res = await api.post("/api/papers", body);
      setToast({ msg: "Paper created", type: "success" });
      setTimeout(() => router.push(`/teacher/papers/${res.data.data.id}/build`), 800);
    } catch (err: unknown) {
      setToast({ msg: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed", type: "error" });
    } finally { setSaving(false); }
  }

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="animate-fade-in" style={{ padding: "2.5rem 2rem 5rem", maxWidth: "44rem", margin: "0 auto" }}>
        <header style={{ marginBottom: "2rem" }}>
          <p className="section-label" style={{ marginBottom: "0.375rem" }}>Exam Management</p>
          <h1 className="page-heading" style={{ margin: 0 }}>Create Exam Paper</h1>
        </header>

        <form onSubmit={handleSubmit} className="card" style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="input-glass" placeholder="e.g. Java Midterm Examination" style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input-glass" placeholder="Optional description…" style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            <div><label style={labelStyle}>Duration (min)</label><input type="number" value={durationMins} onChange={e => setDurationMins(e.target.value)} required className="input-glass" /></div>
            <div><label style={labelStyle}>Total Score</label><input type="number" value={totalScore} onChange={e => setTotalScore(e.target.value)} required className="input-glass" /></div>
            <div><label style={labelStyle}>Pass Score</label><input type="number" value={passScore} onChange={e => setPassScore(e.target.value)} required className="input-glass" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div><label style={labelStyle}>Start Time</label><input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-glass" /></div>
            <div><label style={labelStyle}>End Time</label><input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-glass" /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary" style={{ width: "100%" }}>
            {saving ? "Creating…" : "Create and Build Paper"}
          </button>
        </form>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
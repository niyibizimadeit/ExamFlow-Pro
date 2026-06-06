"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.75rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.12em",
  color: "var(--ink-400, #b8a18a)", marginBottom: "0.5rem",
  fontFamily: "'DM Sans', sans-serif",
};

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "0.875rem 1rem",
  fontSize: "0.9375rem", borderRadius: "10px", outline: "none",
  border: "1.5px solid rgba(212,180,131,0.5)",
  background: "rgba(253,250,244,0.7)", color: "var(--ink-900)",
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "var(--amber-accent)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,115,42,0.12)";
};
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "rgba(212,180,131,0.5)";
  e.currentTarget.style.boxShadow = "none";
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
      const body: Record<string, unknown> = {
        title, description,
        durationMins: parseInt(durationMins),
        totalScore: parseFloat(totalScore),
        passScore: parseFloat(passScore),
      };
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
      <main className="animate-fade-in" style={{ padding: "3rem 2rem 6rem", maxWidth: "44rem", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "2.5rem" }}>
          <Link href="/teacher/papers" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none" }}>
            ← Back to Papers
          </Link>
          <div style={{ marginTop: "0.875rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>
              Exam Management
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.75rem", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, margin: 0 }}>
              Create Exam Paper
            </h1>
            <p style={{ fontSize: "1rem", color: "var(--ink-400, #b8a18a)", marginTop: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
              Fill in the details, then add questions in the builder
            </p>
          </div>
        </header>

        {/* Form card */}
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            <div>
              <label style={labelStyle}>Title</label>
              <input
                value={title} onChange={e => setTitle(e.target.value)} required
                placeholder="e.g. Java Midterm Examination"
                style={inputStyle} onFocus={focus} onBlur={blur}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                rows={3} placeholder="Optional description…"
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55 }}
                onFocus={focus as never} onBlur={blur as never}
              />
            </div>

            {/* Scores row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[
                { label: "Duration (min)", value: durationMins, set: setDurationMins, placeholder: "60" },
                { label: "Total Score",   value: totalScore,   set: setTotalScore,   placeholder: "100" },
                { label: "Pass Score",    value: passScore,    set: setPassScore,    placeholder: "60" },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    type="number" value={f.value} required
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={inputStyle} onFocus={focus} onBlur={blur}
                  />
                </div>
              ))}
            </div>

            {/* Time window */}
            <div>
              <p style={{ ...labelStyle, marginBottom: "0.875rem" }}>Time Window (optional)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: "0.6875rem" }}>Start Time</label>
                  <input
                    type="datetime-local" value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={inputStyle} onFocus={focus} onBlur={blur}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: "0.6875rem" }}>End Time</label>
                  <input
                    type="datetime-local" value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    style={inputStyle} onFocus={focus} onBlur={blur}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,180,131,0.4), transparent)" }} />

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%", padding: "0.9375rem", borderRadius: "10px", border: "none",
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.55 : 1,
                fontSize: "0.9375rem", fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                color: "#fdf8f0", letterSpacing: "0.01em",
                background: "linear-gradient(135deg, var(--amber-accent) 0%, #7a3318 100%)",
                boxShadow: "0 3px 12px rgba(181,115,42,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(181,115,42,0.36)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 3px 12px rgba(181,115,42,0.28)"; }}
            >
              {saving ? "Creating…" : "Create and Build Paper"}
            </button>
          </div>
        </form>

      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
export const T = {
  bg: "#0f0f14", card: "#1a1a24", accent: "#7c3aed", accentLight: "#a78bfa",
  accentGlow: "rgba(124,58,237,0.15)", text: "#e4e4ed", textMuted: "#8888a4",
  border: "#2a2a3d", success: "#10b981", warning: "#f59e0b", danger: "#ef4444",
  gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
  sidebar: "#13131b", sidebarActive: "#7c3aed18",
};

export const S = {
  h2: { fontSize: 26, fontWeight: 700, marginBottom: 20 },
  h3: { fontSize: 18, fontWeight: 600, marginBottom: 12 },
  card: { background: T.card, borderRadius: 16, padding: 24, border: `1px solid ${T.border}`, marginBottom: 16 },
  btn: (v="primary") => ({
    padding: v==="sm" ? "6px 14px" : "12px 24px", borderRadius: 10,
    border: v==="outline" ? `1px solid ${T.border}` : "none",
    background: v==="primary" ? T.gradient : v==="danger" ? T.danger : v==="live" ? "linear-gradient(135deg,#ef4444,#dc2626)" : "transparent",
    color: "#fff", fontSize: v==="sm" ? 13 : 15, fontWeight: 600, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s",
  }),
  badge: (c=T.accent) => ({ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${c}22`, color: c }),
  container: { maxWidth: 1000, margin: "0 auto", padding: "32px 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  input: { width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 15, boxSizing: "border-box", outline: "none" },
  textarea: { width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 15, minHeight: 80, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 24 },
  modalContent: { background: T.card, borderRadius: 20, padding: 32, maxWidth: 500, width: "100%", border: `1px solid ${T.border}` },
  statNum: { fontSize: 36, fontWeight: 800, background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  progressBar: { height: 6, borderRadius: 3, background: T.border, position: "relative", overflow: "hidden", width: "100%" },
  progressFill: (pct, color=T.accent) => ({ position: "absolute", top:0, left:0, height: "100%", width: `${pct}%`, borderRadius: 3, background: color }),
};

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'

export default function CheckInModal() {
  const { showCheckIn: s, setShowCheckIn, routines, checkInData, setCheckInData, setGoals, setRoutineChecks, setCheckedIn } = useApp()
  const [goal, setGoal] = useState(checkInData[s?.id]?.goal || "")
  const [checks, setChecks] = useState(checkInData[s?.id]?.checks || {})
  const activeRoutines = routines.filter(r => r.active)
  const checked = Object.values(checks).filter(Boolean).length

  return (
    <div style={S.modal} onClick={() => setShowCheckIn(null)}>
      <div style={{ ...S.modalContent, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 12, background: "rgba(239,68,68,0.1)", marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.danger, animation: "cw-pulse 1.5s infinite" }} />
            <span style={{ fontWeight: 700, color: T.danger }}>Quick Check-In</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{s?.title} – {s?.host}</h2>
          <p style={{ color: T.textMuted, fontSize: 14 }}>{s?.startTime}–{s?.endTime} Uhr · Dauert ca. 1 Minute</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "block" }}>Was willst du heute schaffen?</label>
          <textarea style={S.textarea} value={goal} onChange={e => setGoal(e.target.value)} placeholder="z.B. 3 Kapitel schreiben, Steuern fertig machen..." rows={2} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "block" }}>Fokus-Routine ({checked}/{activeRoutines.length})</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {activeRoutines.map(r => (
              <button key={r.id} onClick={() => setChecks(c => ({...c, [r.id]: !c[r.id]}))} style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                background: checks[r.id] ? `${T.success}18` : T.bg,
                border: `1px solid ${checks[r.id] ? T.success+"50" : T.border}`,
                color: checks[r.id] ? T.success : T.textMuted, fontWeight: checks[r.id] ? 600 : 400,
              }}>
                {checks[r.id] && <Icon name="check" size={12} />} {r.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn("outline"), flex: 1, justifyContent: "center" }} onClick={() => setShowCheckIn(null)}>Spaeter</button>
          <button style={{ ...S.btn("live"), flex: 2, justifyContent: "center" }} onClick={() => {
            setCheckInData(d => ({...d, [s.id]: { goal, checks }}))
            setGoals(g => ({...g, [s.id]: goal}))
            setRoutineChecks(rc => ({...rc, [s.id]: checks}))
            setCheckedIn(ci => new Set([...ci, s.id]))
            setShowCheckIn(null)
          }}>
            <Icon name="zap" size={16} /> Los geht's!
          </button>
        </div>
      </div>
    </div>
  )
}

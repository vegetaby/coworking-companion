import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'

export default function RoutineModal() {
  const { showRoutineModal, setShowRoutineModal, routines, routineChecks, setRoutineChecks } = useApp()
  const active = routines.filter(r => r.active)
  const [checks, setChecks] = useState(routineChecks[showRoutineModal] || {})
  const cnt = Object.values(checks).filter(Boolean).length

  return (
    <div style={S.modal} onClick={() => setShowRoutineModal(null)}>
      <div style={S.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={S.h3}>Fokus-Checkliste</h3>
          <button style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }} onClick={() => setShowRoutineModal(null)}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ ...S.progressBar, marginBottom: 16 }}><div style={S.progressFill(active.length > 0 ? (cnt/active.length)*100 : 0, T.success)} /></div>
        {active.map(r => (
          <div key={r.id} onClick={() => setChecks(c => ({...c, [r.id]: !c[r.id]}))} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
            background: checks[r.id] ? `${T.success}15` : T.bg, border: `1px solid ${checks[r.id] ? T.success+"40" : T.border}`,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checks[r.id] ? T.success : T.border}`, background: checks[r.id] ? T.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {checks[r.id] && <Icon name="check" size={14} />}
            </div>
            <span style={{ color: checks[r.id] ? T.success : T.text }}>{r.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button style={S.btn("outline")} onClick={() => setShowRoutineModal(null)}>Schliessen</button>
          <button style={S.btn("primary")} onClick={() => { setRoutineChecks(rc => ({...rc, [showRoutineModal]: checks})); setShowRoutineModal(null) }}>Speichern</button>
        </div>
      </div>
    </div>
  )
}

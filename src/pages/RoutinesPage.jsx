import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'

export default function RoutinesPage() {
  const { routines, setRoutines } = useApp()
  const [nr, setNr] = useState("")

  return (
    <div style={S.container}>
      <h1 style={{ ...S.h2, marginBottom: 32 }}>Fokus-Routinen</h1>
      <p style={{ color: T.textMuted, marginBottom: 24, maxWidth: 500 }}>Deine persoenliche Pre-Session-Checkliste. Aktive Routinen erscheinen bei jedem Check-In.</p>
      <div style={{ maxWidth: 500 }}>
        {routines.map(r => (
          <div key={r.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${r.active ? T.success : T.border}`, background: r.active ? T.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onClick={() => setRoutines(rs => rs.map(x => x.id === r.id ? {...x, active: !x.active} : x))}>
              {r.active && <Icon name="check" size={14} />}
            </div>
            <span style={{ flex: 1, fontSize: 15, color: r.active ? T.text : T.textMuted }}>{r.label}</span>
            <button style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }} onClick={() => setRoutines(rs => rs.filter(x => x.id !== r.id))}><Icon name="x" size={16} /></button>
          </div>
        ))}
        <div style={{ ...S.card, display: "flex", gap: 8, padding: 12 }}>
          <input style={S.input} placeholder="Neue Routine..." value={nr} onChange={e => setNr(e.target.value)} onKeyDown={e => { if (e.key==="Enter"&&nr.trim()) { setRoutines(rs => [...rs, {id:"r"+Date.now(),label:nr.trim(),active:true,activeSince:new Date().toISOString().split("T")[0],activeUntil:null}]); setNr("") }}} />
          <button style={{ ...S.btn("primary"), padding: "10px 16px" }} onClick={() => { if(nr.trim()) { setRoutines(rs => [...rs, {id:"r"+Date.now(),label:nr.trim(),active:true,activeSince:new Date().toISOString().split("T")[0],activeUntil:null}]); setNr("") }}}><Icon name="plus" size={16} /></button>
        </div>
      </div>
    </div>
  )
}

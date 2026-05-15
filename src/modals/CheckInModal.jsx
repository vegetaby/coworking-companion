import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'
import { checkInAttendance } from '../lib/api'

const trimTime = (t) => (typeof t === 'string' ? t.slice(0, 5) : t)

export default function CheckInModal() {
  const { user } = useAuth()
  const { showCheckIn: s, setShowCheckIn, realRoutines, refreshRealData } = useApp()
  const activeRoutines = (realRoutines || []).filter(r => r.active)

  const [goal, setGoal] = useState('')
  // routine_states: { "Label": boolean } — wir speichern beim Submit nur die
  // Routine-Labels, weil routine_states in der DB ein JSON-Map ohne FK ist.
  const [checks, setChecks] = useState(() => {
    const init = {}
    activeRoutines.forEach(r => { init[r.label] = false })
    return init
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const checked = Object.values(checks).filter(Boolean).length

  // Falls das Modal ohne Session geoeffnet wird (sollte nicht), Fallback.
  if (!s) return null

  // Fallback: Mock-Session-Felder unterstuetzen, damit das Modal robust ist.
  const hostName = s.host_name ?? s.host ?? ''
  const startTime = trimTime(s.start_time ?? s.startTime)
  const endTime = trimTime(s.end_time ?? s.endTime)

  const handleSubmit = async () => {
    if (!user?.id || !s.id) {
      setError('Nicht eingeloggt — bitte neu laden.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await checkInAttendance(user.id, s.id, {
        goalBefore: goal,
        routineStates: checks,
      })
      await refreshRealData()
      setShowCheckIn(null)
    } catch (err) {
      console.error('checkInAttendance failed:', err)
      setError(err.message ?? 'Check-In fehlgeschlagen')
      setBusy(false)
    }
  }

  return (
    <div style={S.modal} onClick={() => !busy && setShowCheckIn(null)}>
      <div style={{ ...S.modalContent, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.danger, animation: 'cw-pulse 1.5s infinite' }} />
            <span style={{ fontWeight: 700, color: T.danger }}>Quick Check-In</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{s.title}{hostName ? ` – ${hostName}` : ''}</h2>
          <p style={{ color: T.textMuted, fontSize: 14 }}>{startTime}{endTime ? `–${endTime}` : ''} Uhr · Dauert ca. 1 Minute</p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: `${T.danger}15`, border: `1px solid ${T.danger}40`, color: T.danger, fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Was willst du heute schaffen?</label>
          <textarea
            style={S.textarea}
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="z.B. 3 Kapitel schreiben, Steuern fertig machen..."
            rows={2}
            disabled={busy}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>
            Fokus-Routine ({checked}/{activeRoutines.length})
          </label>
          {activeRoutines.length === 0 ? (
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
              Noch keine aktiven Routinen. Lege welche unter "Fokus-Routinen" an.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activeRoutines.map(r => (
                <button
                  key={r.id}
                  onClick={() => setChecks(c => ({ ...c, [r.label]: !c[r.label] }))}
                  disabled={busy}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: busy ? 'wait' : 'pointer',
                    background: checks[r.label] ? `${T.success}18` : T.bg,
                    border: `1px solid ${checks[r.label] ? T.success + '50' : T.border}`,
                    color: checks[r.label] ? T.success : T.textMuted, fontWeight: checks[r.label] ? 600 : 400,
                  }}
                >
                  {checks[r.label] && <Icon name="check" size={12} />} {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ ...S.btn('outline'), flex: 1, justifyContent: 'center' }}
            onClick={() => setShowCheckIn(null)}
            disabled={busy}
          >
            Spaeter
          </button>
          <button
            style={{ ...S.btn('live'), flex: 2, justifyContent: 'center', opacity: busy ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={busy}
          >
            <Icon name="zap" size={16} /> {busy ? 'Speichere…' : "Los geht's!"}
          </button>
        </div>
      </div>
    </div>
  )
}

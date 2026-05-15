import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'
import { dismissPendingCheckout } from '../lib/api'
import { formatDate } from '../lib/utils'

const trimTime = (t) => (typeof t === 'string' ? t.slice(0, 5) : t)

const STORAGE_PREFIX = 'cw-unfinished-shown-'

// Liefert die erste pending Attendance, die wir noch nicht als "schon gezeigt"
// im localStorage markiert haben. Damit poppt das Modal pro Attendance nur
// einmal pro Browser-Session/Geraet, nicht endlos bei jedem Mount.
function pickNextPending(pending) {
  if (!Array.isArray(pending)) return null
  for (const att of pending) {
    if (!att?.id) continue
    try {
      if (!localStorage.getItem(STORAGE_PREFIX + att.id)) return att
    } catch {
      // localStorage nicht verfuegbar (Privatmodus?) -> ueberspringen
      return att
    }
  }
  return null
}

export default function UnfinishedCheckoutModal() {
  const { user } = useAuth()
  const { pendingCheckouts, setShowCheckOut, refreshRealData } = useApp()

  // Die Attendance, die wir gerade anzeigen. Wir wechseln aktiv, wenn
  // pendingCheckouts sich aendert (z.B. nach erfolgreichem Dismiss).
  const current = useMemo(() => pickNextPending(pendingCheckouts), [pendingCheckouts])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Beim Mounten/Wechsel: Attendance-ID im localStorage als "gezeigt" markieren,
  // damit derselbe Eintrag nicht nach Reload sofort wieder aufpoppt.
  useEffect(() => {
    if (!current?.id) return
    try {
      localStorage.setItem(STORAGE_PREFIX + current.id, '1')
    } catch {
      // localStorage nicht verfuegbar -> egal
    }
  }, [current?.id])

  if (!user || !current) return null

  const session = current.session || {}
  const dateStr = session.date ? formatDate(session.date) : ''
  const startStr = trimTime(session.start_time)
  const endStr = trimTime(session.end_time)

  const handleRemember = () => {
    // Macht eigentlichen Check-Out-Flow auf, dort kann der User Ziel/Rating
    // nachtragen. Wir schliessen NUR diesen Modal-State (current loest sich
    // automatisch ueber pickNextPending neu auf).
    setShowCheckOut(session)
  }

  const handleDontRemember = async () => {
    if (!user?.id || !session?.id) return
    setBusy(true)
    setError(null)
    try {
      await dismissPendingCheckout(user.id, session.id)
      await refreshRealData()
    } catch (err) {
      console.error('dismissPendingCheckout failed:', err)
      setError(err.message ?? 'Konnte nicht gespeichert werden')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={S.modal}
      // Bewusst kein onClick auf Backdrop — Modal ist nicht dismissable.
    >
      <div style={{ ...S.modalContent, maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 12,
            background: `${T.warning}15`, marginBottom: 16,
          }}>
            <Icon name="clock" size={16} />
            <span style={{ fontWeight: 700, color: T.warning }}>Offene Session</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Hast du diese Session abgeschlossen?
          </h2>
          <p style={{ color: T.textMuted, fontSize: 14, marginTop: 8 }}>
            {session.title || 'Session'}
            {dateStr && <> · {dateStr}</>}
            {startStr && <> · {startStr}{endStr ? `–${endStr}` : ''}</>}
          </p>
          {current.goal_before && (
            <p style={{ color: T.accentLight, fontSize: 14, marginTop: 8 }}>
              Dein Ziel war: "{current.goal_before}"
            </p>
          )}
        </div>

        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: `${T.danger}15`, border: `1px solid ${T.danger}40`,
            color: T.danger, fontSize: 14,
          }}>
            {error}
          </div>
        )}

        <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', marginBottom: 20 }}>
          Du hast dich eingecheckt, aber nicht ausgecheckt. Magst du es kurz nachholen?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            style={{ ...S.btn('primary'), justifyContent: 'center' }}
            onClick={handleRemember}
            disabled={busy}
          >
            <Icon name="check" size={16} /> Ich erinnere mich
          </button>
          <button
            style={{ ...S.btn('outline'), justifyContent: 'center' }}
            onClick={handleDontRemember}
            disabled={busy}
          >
            {busy ? 'Speichere…' : 'Ich weiss es nicht mehr'}
          </button>
        </div>
      </div>
    </div>
  )
}

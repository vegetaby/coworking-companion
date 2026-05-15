import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'
import { createRoutine, updateRoutine, deleteRoutine } from '../lib/api'

const TUTORIAL_DISMISS_KEY = 'cw-routines-tutorial-dismissed'

export default function RoutinesPage() {
  const { user } = useAuth()
  const { realRoutines, realLoading, refreshRealData } = useApp()
  const [nr, setNr] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [tutorialDismissed, setTutorialDismissed] = useState(
    () => localStorage.getItem(TUTORIAL_DISMISS_KEY) === '1'
  )

  useEffect(() => {
    localStorage.setItem(TUTORIAL_DISMISS_KEY, tutorialDismissed ? '1' : '0')
  }, [tutorialDismissed])

  const handleAdd = async () => {
    const label = nr.trim()
    if (!label || !user?.id) return
    setBusy(true)
    setError(null)
    try {
      const nextOrder = realRoutines.length > 0
        ? Math.max(...realRoutines.map(r => r.sort_order ?? 0)) + 1
        : 0
      await createRoutine(user.id, label, nextOrder)
      setNr('')
      await refreshRealData()
    } catch (err) {
      console.error('createRoutine failed:', err)
      setError(err.message ?? 'Routine konnte nicht angelegt werden')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleActive = async (r) => {
    setBusy(true)
    setError(null)
    try {
      await updateRoutine(r.id, { active: !r.active })
      await refreshRealData()
    } catch (err) {
      console.error('updateRoutine failed:', err)
      setError(err.message ?? 'Routine konnte nicht aktualisiert werden')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (r) => {
    setBusy(true)
    setError(null)
    try {
      await deleteRoutine(r.id)
      await refreshRealData()
    } catch (err) {
      console.error('deleteRoutine failed:', err)
      setError(err.message ?? 'Routine konnte nicht geloescht werden')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={S.container}>
      <h1 style={{ ...S.h2, marginBottom: 16 }}>Fokus-Routinen</h1>

      {!tutorialDismissed && (
        <div
          style={{
            maxWidth: 500,
            marginBottom: 20,
            padding: '14px 16px',
            borderRadius: 12,
            background: `linear-gradient(135deg, ${T.accentGlow}, rgba(124,58,237,0.04))`,
            border: `1px solid ${T.accent}30`,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accentLight, flexShrink: 0 }}>
            <Icon name="info" size={18} />
          </div>
          <div style={{ flex: 1, fontSize: 14, color: T.text }}>
            <strong>So funktionieren Routinen</strong> — lege deine persoenliche Pre-Session-Checkliste an. Beim Check-In zu einer Session kannst du jede aktive Routine abhaken und siehst spaeter, welche Gewohnheiten dich am produktivsten machen.
          </div>
          <button
            onClick={() => setTutorialDismissed(true)}
            aria-label="Tutorial ausblenden"
            style={{
              background: 'transparent',
              border: 'none',
              color: T.textMuted,
              cursor: 'pointer',
              padding: 4,
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      <p style={{ color: T.textMuted, marginBottom: 24, maxWidth: 500 }}>
        Deine persoenliche Pre-Session-Checkliste. Aktive Routinen erscheinen bei jedem Check-In.
      </p>

      {error && (
        <div style={{ maxWidth: 500, marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: `${T.danger}15`, border: `1px solid ${T.danger}40`, color: T.danger, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ maxWidth: 500 }}>
        {realLoading && realRoutines.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', padding: 24, color: T.textMuted }}>Laden…</div>
        ) : realRoutines.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', padding: 24, color: T.textMuted }}>
            Noch keine Routinen angelegt. Leg unten deine erste an.
          </div>
        ) : (
          realRoutines.map(r => (
            <div key={r.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: `2px solid ${r.active ? T.success : T.border}`,
                  background: r.active ? T.success : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: busy ? 'wait' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                }}
                onClick={() => !busy && handleToggleActive(r)}
                role="button"
                aria-label={r.active ? 'Deaktivieren' : 'Aktivieren'}
              >
                {r.active && <Icon name="check" size={14} />}
              </div>
              <span style={{ flex: 1, fontSize: 15, color: r.active ? T.text : T.textMuted }}>{r.label}</span>
              <button
                style={{ background: 'none', border: 'none', color: T.textMuted, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
                onClick={() => !busy && handleDelete(r)}
                disabled={busy}
                aria-label="Routine loeschen"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))
        )}

        <div style={{ ...S.card, display: 'flex', gap: 8, padding: 12 }}>
          <input
            style={S.input}
            placeholder="Neue Routine..."
            value={nr}
            disabled={busy || !user}
            onChange={e => setNr(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
          <button
            style={{ ...S.btn('primary'), padding: '10px 16px', opacity: busy ? 0.6 : 1 }}
            onClick={handleAdd}
            disabled={busy || !nr.trim() || !user}
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'
import {
  checkOutAttendance,
  confirmAttendance,
  fetchSessionSignupsWithProfiles,
} from '../lib/api'

export default function CheckOutModal() {
  const { user } = useAuth()
  const { showCheckOut: s, setShowCheckOut, realAttendances, refreshRealData } = useApp()
  const [result, setResult] = useState('')
  const [rating, setRating] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Host-Bestaetigung: Map { userId: boolean } — Default fuer alle ist true
  // (Annahme: wer angemeldet war, war auch da; Host korrigiert nur die Ausnahmen).
  const [signups, setSignups] = useState([])
  const [signupsLoading, setSignupsLoading] = useState(false)
  const [confirmations, setConfirmations] = useState({})

  // Ziel-Vorbeleg aus dem Check-In, damit der Nutzer weiss, was er sich vorgenommen hat.
  const previousGoal = useMemo(() => {
    if (!s?.id) return ''
    const att = (realAttendances || []).find(a => a.session_id === s.id)
    return att?.goal_before || ''
  }, [realAttendances, s?.id])

  // Ist der aktuelle User Host dieser Session?
  const isHost = !!(s && user?.id && s.host_id === user.id)

  // Signups laden, sobald das Modal als Host geoeffnet wird.
  useEffect(() => {
    if (!isHost || !s?.id) return
    let cancelled = false
    setSignupsLoading(true)
    fetchSessionSignupsWithProfiles(s.id)
      .then(rows => {
        if (cancelled) return
        setSignups(rows)
        // Default: alle anwesend
        const init = {}
        rows.forEach(r => { init[r.user_id] = true })
        setConfirmations(init)
      })
      .catch(err => {
        if (cancelled) return
        console.warn('fetchSessionSignupsWithProfiles failed:', err)
      })
      .finally(() => {
        if (!cancelled) setSignupsLoading(false)
      })
    return () => { cancelled = true }
  }, [isHost, s?.id])

  // Falls das Modal ohne Session geoeffnet wird, Fallback.
  if (!s) return null

  const toggleConfirmation = (userId) => {
    setConfirmations(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  const handleSubmit = async () => {
    if (!user?.id || !s.id) {
      setError('Nicht eingeloggt — bitte neu laden.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      // 1. Eigener Check-Out
      await checkOutAttendance(user.id, s.id, {
        goalAfter: result,
        rating: rating || null,
      })
      // 2. Falls Host: Anwesenheiten bestaetigen.
      if (isHost && Object.keys(confirmations).length > 0) {
        await confirmAttendance(user.id, s.id, confirmations)
      }
      await refreshRealData()
      setShowCheckOut(null)
    } catch (err) {
      console.error('checkOutAttendance/confirmAttendance failed:', err)
      setError(err.message ?? 'Check-Out fehlgeschlagen')
      setBusy(false)
    }
  }

  return (
    <div style={S.modal} onClick={() => !busy && setShowCheckOut(null)}>
      <div style={{ ...S.modalContent, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 12, background: `${T.success}15`, marginBottom: 16 }}>
            <Icon name="check" size={16} />
            <span style={{ fontWeight: 700, color: T.success }}>Quick Check-Out</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Session geschafft!</h2>
          {previousGoal && <p style={{ color: T.accentLight, fontSize: 14 }}>Dein Ziel: "{previousGoal}"</p>}
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: `${T.danger}15`, border: `1px solid ${T.danger}40`, color: T.danger, fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Was hast du erreicht?</label>
          <textarea
            style={S.textarea}
            value={result}
            onChange={e => setResult(e.target.value)}
            placeholder="z.B. 2 von 3 Kapiteln geschafft..."
            rows={2}
            disabled={busy}
          />
        </div>

        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'block' }}>Wie produktiv war die Session?</label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onClick={() => setRating(i)}
                disabled={busy}
                style={{
                  width: 52, height: 52, borderRadius: 12, border: `2px solid ${i <= rating ? T.warning : T.border}`,
                  background: i <= rating ? `${T.warning}18` : T.bg, cursor: busy ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i <= rating ? T.warning : T.textMuted, fontSize: 20, transition: 'all 0.15s',
                }}
              >
                <Icon name={i <= rating ? 'star' : 'starEmpty'} size={24} />
              </button>
            ))}
          </div>
        </div>

        {isHost && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>
              Wer war dabei?
            </label>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px' }}>
              Klick auf einen Namen, falls jemand nicht da war.
            </p>
            {signupsLoading ? (
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Lade Teilnehmer…</p>
            ) : signups.length === 0 ? (
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                Keine Anmeldungen fuer diese Session.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {signups.map(row => {
                  const userId = row.user_id
                  const name = row.profile?.display_name || row.user_id
                  const present = !!confirmations[userId]
                  return (
                    <button
                      key={userId}
                      type="button"
                      onClick={() => !busy && toggleConfirmation(userId)}
                      disabled={busy}
                      aria-pressed={present}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        cursor: busy ? 'wait' : 'pointer',
                        background: present ? `${T.success}18` : `${T.danger}18`,
                        border: `1px solid ${present ? T.success + '50' : T.danger + '50'}`,
                        color: present ? T.success : T.danger,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon name={present ? 'check' : 'x'} size={12} /> {name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ ...S.btn('outline'), flex: 1, justifyContent: 'center' }}
            onClick={() => setShowCheckOut(null)}
            disabled={busy}
          >
            Spaeter
          </button>
          <button
            style={{ ...S.btn('primary'), flex: 2, justifyContent: 'center', opacity: busy ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={busy}
          >
            <Icon name="send" size={16} /> {busy ? 'Speichere…' : 'Abschliessen'}
          </button>
        </div>
      </div>
    </div>
  )
}

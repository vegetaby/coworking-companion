import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'

// Reset-Password-Seite: User landet hier nach Klick auf den Reset-Link aus der
// E-Mail. Supabase setzt die Recovery-Session automatisch aus den URL-Params,
// daher muss der User NICHT vorab eingeloggt sein.
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Bei Erfolg automatisch zum Dashboard nach 2s
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => navigate('/', { replace: true }), 2000)
    return () => clearTimeout(t)
  }, [success, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError(err?.message ?? 'Unerwarteter Fehler. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ ...S.modalContent, maxWidth: 420, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accentLight }}>
            <Icon name="zap" size={20} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Neues Passwort setzen</h2>
        </div>

        {success ? (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: `${T.success}15`, border: `1px solid ${T.success}40`, color: T.success, fontSize: 14 }}>
            Passwort erfolgreich geändert. Du wirst gleich weitergeleitet…
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
              Wähle ein neues Passwort für dein Konto. Du wirst danach automatisch eingeloggt.
            </p>
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, marginBottom: 6, display: 'block' }}>
                Neues Passwort
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                style={S.input}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, marginBottom: 6, display: 'block' }}>
                Passwort bestätigen
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Passwort wiederholen"
                style={S.input}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.danger}15`, border: `1px solid ${T.danger}40`, color: T.danger, fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ ...S.btn('primary'), width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Bitte warten…' : 'Passwort setzen'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 13, marginTop: 4 }}
            >
              Zurück zur Startseite
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

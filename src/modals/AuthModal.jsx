import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'

export default function AuthModal({ initialMode = 'login', onClose }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const reset = () => {
    setError('')
    setInfo('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    reset()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email.trim(), password)
        if (error) setError(error.message)
        else onClose?.()
      } else if (mode === 'signup') {
        const { error } = await signUpWithEmail(email.trim(), password, displayName.trim() || undefined)
        if (error) setError(error.message)
        else setInfo('Konto erstellt. Bitte prüfe dein Postfach für die Bestätigung.')
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim())
        if (error) setError(error.message)
        else setInfo('Falls die Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    reset()
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const title = mode === 'signup' ? 'Konto erstellen' : mode === 'forgot' ? 'Passwort zurücksetzen' : 'Anmelden'
  const submitLabel = mode === 'signup' ? 'Registrieren' : mode === 'forgot' ? 'Reset-Link senden' : 'Einloggen'

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{ ...S.modalContent, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h2>
          {onClose && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 4 }} aria-label="Schließen">
              <Icon name="x" size={20} />
            </button>
          )}
        </div>

        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              style={{ ...S.btn('outline'), width: '100%', justifyContent: 'center', marginBottom: 12, opacity: loading ? 0.6 : 1 }}
            >
              <Icon name="google" size={18} /> Mit Google fortfahren
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 16px', color: T.textMuted, fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span>oder</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, marginBottom: 6, display: 'block' }}>Anzeigename (optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Wie sollen wir dich nennen?"
                style={S.input}
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, color: T.textMuted, marginBottom: 6, display: 'block' }}>E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="du@example.com"
              style={S.input}
              autoComplete="email"
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, marginBottom: 6, display: 'block' }}>Passwort</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                style={S.input}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.danger}15`, border: `1px solid ${T.danger}40`, color: T.danger, fontSize: 13 }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.success}15`, border: `1px solid ${T.success}40`, color: T.success, fontSize: 13 }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...S.btn('primary'), width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Bitte warten…' : submitLabel}
          </button>
        </form>

        <div style={{ marginTop: 18, fontSize: 13, color: T.textMuted, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => { reset(); setMode('forgot') }} style={{ background: 'transparent', border: 'none', color: T.accentLight, cursor: 'pointer', fontSize: 13 }}>
                Passwort vergessen?
              </button>
              <div>
                Noch kein Konto?{' '}
                <button type="button" onClick={() => { reset(); setMode('signup') }} style={{ background: 'transparent', border: 'none', color: T.accentLight, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Jetzt registrieren
                </button>
              </div>
            </>
          )}
          {mode === 'signup' && (
            <div>
              Bereits ein Konto?{' '}
              <button type="button" onClick={() => { reset(); setMode('login') }} style={{ background: 'transparent', border: 'none', color: T.accentLight, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Einloggen
              </button>
            </div>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => { reset(); setMode('login') }} style={{ background: 'transparent', border: 'none', color: T.accentLight, cursor: 'pointer', fontSize: 13 }}>
              Zurück zum Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

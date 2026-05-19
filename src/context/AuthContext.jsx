import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

// Bug-Fix 4: Profile-Loading mit Retry + exponentiellem Backoff.
// Netzwerk-Hick-Ups (z. B. Mobile, schlechtes WLAN) sollen nicht dazu fuehren,
// dass das Dashboard ohne Profil bleibt. Wir versuchen es bis zu 3x,
// loggen jeden Fehler, und geben am Ende kontrolliert auf.
const PROFILE_FETCH_MAX_ATTEMPTS = 3
const PROFILE_FETCH_BASE_DELAY_MS = 400

// Erkennt invalid/expired Token-Fehler, bei denen ein Retry sinnlos ist.
// Wir machen dann lieber einen sauberen Logout, statt den User in einem
// "Ghost"-Zustand zu lassen (User-Objekt da, aber Profil null).
const _isAuthError = (err) => {
  if (!err) return false
  const code = err.status || err.statusCode || err.code
  const msg = (err.message || '').toLowerCase()
  return (
    code === 401 || code === '401' ||
    code === 'PGRST301' ||           // JWT expired (PostgREST)
    msg.includes('jwt expired') ||
    msg.includes('invalid jwt') ||
    msg.includes('invalid token') ||
    msg.includes('not authenticated')
  )
}

const fetchProfileWithRetry = async (userId) => {
  let lastError = null
  for (let attempt = 1; attempt <= PROFILE_FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        lastError = error
        if (error.code === 'PGRST116') return { data: null, error: null }
        if (_isAuthError(error)) return { data: null, error, isAuthError: true }
        throw error
      }
      return { data, error: null }
    } catch (err) {
      lastError = err
      if (_isAuthError(err)) return { data: null, error: err, isAuthError: true }
      console.warn(
        `[Auth] fetchProfile attempt ${attempt}/${PROFILE_FETCH_MAX_ATTEMPTS} failed:`,
        err?.message || err
      )
      if (attempt < PROFILE_FETCH_MAX_ATTEMPTS) {
        const delay = PROFILE_FETCH_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  console.error('[Auth] fetchProfile gave up after retries', lastError)
  return { data: null, error: lastError }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data, isAuthError } = await fetchProfileWithRetry(userId)
    if (isAuthError) {
      // Push 5.1 — Race-Fix:
      // Nur setUser(null) / setProfile(null) reichte nicht, weil supabase-js
      // im onAuthStateChange-Listener mit dem (noch im memory cached) Token
      // den User nochmal restored hat. Wir machen jetzt einen harten Reload,
      // genau wie resetLocalSession(). Das ist der einzige sichere Weg
      // einen tot-cached State loszuwerden.
      console.warn('[Auth] fetchProfile got auth error, performing hard reset')
      try { await supabase.auth.signOut({ scope: 'local' }) } catch {}
      try {
        window.localStorage.clear()
        window.sessionStorage.clear()
      } catch {}
      // Hard reload statt setState — vermeidet die Race-Condition mit
      // onAuthStateChange das den User nochmal restoren wuerde.
      window.location.replace('/')
      return
    }
    setProfile(data)
  }

  useEffect(() => {
    // Safety-Net: wenn getSession aus irgendwelchen Gruenden haengt
    // (kaputter JWT im localStorage, Netzwerk-Hick-Up), nach 6 Sek
    // den Ladestatus trotzdem aufgeben. Sonst friert die App ein.
    const safetyTimeout = setTimeout(() => setLoading(false), 6000)

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        setLoading(false)
        clearTimeout(safetyTimeout)
      })
      .catch((err) => {
        console.error('Auth init failed:', err)
        setLoading(false)
        clearTimeout(safetyTimeout)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Hilfs-Funktion fuer "App haengt" - Reset aller lokalen Auth-Daten
  // (alte JWTs, gecachte Sessions) und Page-Reload. Wird vom Loading-Screen
  // angeboten falls er zu lange haengt.
  const resetLocalSession = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // ignore - reset anyway
    }
    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
    } catch {
      // ignore
    }
    window.location.replace('/')
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) return { error }
    return { error: null }
  }

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signUpWithEmail = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: displayName ? { display_name: displayName } : undefined,
      },
    })
    return { data, error }
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  // Bug-Fix 1: signOut-Robustness.
  // - Best Effort: erst server-side signOut probieren, dann lokale Bereinigung.
  // - Falls supabase.auth.signOut() haengt oder einen Fehler wirft (z.B. abgelaufenes JWT,
  //   Netzwerk-Issue), bleibt der User trotzdem in einem konsistenten "ausgeloggt"-Zustand,
  //   weil wir den lokalen State immer cleanen.
  // - Falls ALLES schiefgeht (z.B. Storage nicht verfuegbar), fallen wir auf
  //   einen harten Page-Reload zurueck, damit der User nie "halb-eingeloggt" festhaengt.
  const signOut = async () => {
    let serverSignOutOk = false
    try {
      // 8s Timeout - sonst hat ein haengender signOut() den User ewig blockiert.
      const signOutPromise = supabase.auth.signOut({ scope: 'global' })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('signOut timeout')), 8000)
      )
      const { error } = await Promise.race([signOutPromise, timeoutPromise])
      if (error) {
        console.warn('[Auth] signOut returned error:', error.message)
      } else {
        serverSignOutOk = true
      }
    } catch (err) {
      console.warn('[Auth] signOut threw, falling back to local cleanup:', err?.message || err)
    }

    // Lokalen State IMMER cleanen, egal was passiert ist
    try {
      setUser(null)
      setProfile(null)
    } catch {
      // ignore - im worst case macht der Reload das
    }

    // Wenn server-Signout fehlgeschlagen ist: lokalen Storage auch leeren,
    // damit die App beim naechsten Laden keinen kaputten JWT findet.
    if (!serverSignOutOk) {
      try {
        window.localStorage.removeItem('sb-' + (import.meta.env.VITE_SUPABASE_PROJECT_REF || '') + '-auth-token')
      } catch {
        // ignore
      }
      // Letzte Eskalation - kompletter Reset.
      // Wird nur erreicht wenn Server-Call fehlgeschlagen ist.
      try {
        await resetLocalSession()
      } catch {
        window.location.replace('/')
      }
    }
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isHost: profile?.role === 'host' || profile?.role === 'admin',
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    resetLocalSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

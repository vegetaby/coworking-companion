import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
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

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
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

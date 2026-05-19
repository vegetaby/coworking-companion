import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  fetchSessions,
  fetchMySignups,
  fetchMyAttendances,
  fetchMyRoutines,
  fetchPendingCheckouts,
  fetchUserStreak,
  signUpForSession,
  cancelSignup,
  updateSessionStatuses,
  fetchFeatureFlags,
  updateFeatureFlag,
} from '../lib/api'

// Fallback fuer Feature-Flags, falls die Tabelle leer ist oder ein Fehler
// beim Lesen auftritt. nav_routinen ist per Default aktiv, Leaderboard und
// Analyse sind aus (Mock-Pages werden nicht verlinkt).
const DEFAULT_FEATURE_FLAGS = {
  nav_leaderboard: false,
  nav_analyse: false,
  nav_routinen: true,
}

const AppContext = createContext({})

export function AppProvider({ children }) {
  const { user } = useAuth()

  // ----- Modal-Trigger (UI-State, kein Mock-Daten-State) -----
  // Diese Setter werden von Seiten verwendet, um Modals zu oeffnen.
  const [showGoalModal, setShowGoalModal] = useState(null)
  const [showRoutineModal, setShowRoutineModal] = useState(null)
  const [showCheckIn, setShowCheckIn] = useState(null)
  const [showCheckOut, setShowCheckOut] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showCalExport, setShowCalExport] = useState(false)

  // ----- Restlicher Legacy-Mock-State (nur noch fuer das alte GoalModal +
  //       nicht-mehr-geroutete RoutineModal/Analyse/Leaderboard-Seiten). Wird
  //       in einem spaeteren Batch entfernt, sobald GoalModal auf Supabase
  //       umgestellt ist. -----
  const [goals, setGoals] = useState({})
  const [routineChecks, setRoutineChecks] = useState({})
  const [routines, setRoutines] = useState([])
  const [lbPeriod, setLbPeriod] = useState('7d')

  // ----- Echte Supabase-Daten -----
  const [realSessions, setRealSessions] = useState([])
  const [realSignedUp, setRealSignedUp] = useState(new Set())
  const [realAttendances, setRealAttendances] = useState([])
  const [realRoutines, setRealRoutines] = useState([])
  const [pendingCheckouts, setPendingCheckouts] = useState([])
  const [userStreak, setUserStreak] = useState(0)
  const [realLoading, setRealLoading] = useState(false)
  const [realError, setRealError] = useState(null)

  // Feature-Flags: { key: enabled } Map. Start mit Defaults, damit die UI
  // schon vor dem ersten DB-Read sinnvolle Werte hat.
  const [featureFlags, setFeatureFlags] = useState(DEFAULT_FEATURE_FLAGS)
  // Vollstaendige Flag-Rows (inkl. label, description) fuer die Admin-UI.
  const [featureFlagRows, setFeatureFlagRows] = useState([])

  const refreshFeatureFlags = useCallback(async () => {
    try {
      const rows = await fetchFeatureFlags()
      if (!rows || rows.length === 0) {
        // Tabelle leer (Migration noch nicht angewendet?) -> Defaults behalten
        setFeatureFlags(DEFAULT_FEATURE_FLAGS)
        setFeatureFlagRows([])
        return
      }
      const map = { ...DEFAULT_FEATURE_FLAGS }
      rows.forEach(r => { map[r.key] = !!r.enabled })
      setFeatureFlags(map)
      setFeatureFlagRows(rows)
    } catch (err) {
      // Fehler beim Lesen (z.B. Tabelle existiert noch nicht) -> Defaults
      console.warn('refreshFeatureFlags failed, using defaults:', err)
      setFeatureFlags(DEFAULT_FEATURE_FLAGS)
      setFeatureFlagRows([])
    }
  }, [])

  const setFeatureFlag = useCallback(async (key, enabled) => {
    // Optimistic update: lokal sofort, dann DB. Bei Fehler revert.
    const prev = featureFlags[key]
    setFeatureFlags(curr => ({ ...curr, [key]: !!enabled }))
    setFeatureFlagRows(rows => rows.map(r => r.key === key ? { ...r, enabled: !!enabled } : r))
    try {
      await updateFeatureFlag(key, enabled)
    } catch (err) {
      console.error('setFeatureFlag failed:', err)
      setFeatureFlags(curr => ({ ...curr, [key]: !!prev }))
      setFeatureFlagRows(rows => rows.map(r => r.key === key ? { ...r, enabled: !!prev } : r))
      throw err
    }
  }, [featureFlags])

  const refreshRealData = useCallback(async () => {
    if (!user?.id) {
      setRealSessions([])
      setRealSignedUp(new Set())
      setRealAttendances([])
      setRealRoutines([])
      setPendingCheckouts([])
      setUserStreak(0)
      // Feature-Flags laden wir trotzdem (SELECT ist fuer alle Authenticated
      // erlaubt). Ohne user.id machen wir gar nichts; das ueberlassen wir dem
      // separaten useEffect unten.
      return
    }
    setRealLoading(true)
    setRealError(null)
    // 1. Status auf dem Server frisch berechnen (scheduled -> live -> past),
    //    bevor wir die Sessions laden. Bei Fehler weiterlaufen — wir wollen
    //    nicht die ganze App blockieren, falls die RPC mal nicht greift.
    try {
      await updateSessionStatuses()
    } catch (err) {
      console.warn('updateSessionStatuses failed (continuing):', err)
    }
    try {
      const [sessions, signups, attendances, routinesList, pending, streak] = await Promise.all([
        fetchSessions(),
        fetchMySignups(user.id),
        fetchMyAttendances(user.id),
        fetchMyRoutines(user.id),
        fetchPendingCheckouts(user.id),
        fetchUserStreak(user.id),
      ])
      setRealSessions(sessions)
      setRealSignedUp(signups)
      setRealAttendances(attendances)
      setRealRoutines(routinesList)
      setPendingCheckouts(pending)
      setUserStreak(streak)
    } catch (err) {
      console.error('refreshRealData failed:', err)
      setRealError(err.message ?? 'Daten konnten nicht geladen werden')
    } finally {
      setRealLoading(false)
    }
    // Feature-Flags parallel laden. Bewusst nicht in Promise.all damit ein
    // Fehler hier nicht die Session-Daten blockiert.
    refreshFeatureFlags()
  }, [user?.id, refreshFeatureFlags])

  useEffect(() => {
    refreshRealData()
  }, [refreshRealData])

  const toggleRealSignUp = useCallback(async (sessionId) => {
    if (!user?.id) return
    const wasSignedUp = realSignedUp.has(sessionId)
    setRealSignedUp(prev => {
      const next = new Set(prev)
      wasSignedUp ? next.delete(sessionId) : next.add(sessionId)
      return next
    })
    try {
      if (wasSignedUp) await cancelSignup(user.id, sessionId)
      else await signUpForSession(user.id, sessionId)
    } catch (err) {
      console.error('toggleRealSignUp failed:', err)
      setRealSignedUp(prev => {
        const next = new Set(prev)
        wasSignedUp ? next.add(sessionId) : next.delete(sessionId)
        return next
      })
      setRealError(err.message ?? 'Anmeldung fehlgeschlagen')
    }
  }, [user?.id, realSignedUp])

  const value = {
    // legacy mock state (noch von GoalModal + ungerouteten Pages genutzt)
    goals, setGoals,
    routineChecks, setRoutineChecks,
    routines, setRoutines,
    lbPeriod, setLbPeriod,

    // Modal-Trigger
    showGoalModal, setShowGoalModal,
    showRoutineModal, setShowRoutineModal,
    showCheckIn, setShowCheckIn,
    showCheckOut, setShowCheckOut,
    showOnboarding, setShowOnboarding,
    showCalExport, setShowCalExport,

    // real data
    realSessions,
    realSignedUp,
    realAttendances,
    realRoutines,
    pendingCheckouts,
    userStreak,
    realLoading,
    realError,
    refreshRealData,
    toggleRealSignUp,

    // feature flags
    featureFlags,
    featureFlagRows,
    refreshFeatureFlags,
    setFeatureFlag,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { MOCK_SESSIONS, MOCK_ROUTINES, MOCK_SESSION_STREAKS } from '../data/mockData'
import { useAuth } from './AuthContext'
import {
  fetchSessions,
  fetchMySignups,
  fetchMyAttendances,
  fetchMyRoutines,
  signUpForSession,
  cancelSignup,
} from '../lib/api'

const AppContext = createContext({})

export function AppProvider({ children }) {
  const { user } = useAuth()

  // ----- Mock-State (legacy, wird nach und nach abgeloest) -----
  const [signedUp, setSignedUp] = useState(new Set(["s1","s2","s3","s4"]))
  const [goals, setGoals] = useState({})
  const [routineChecks, setRoutineChecks] = useState({})
  const [routines, setRoutines] = useState(MOCK_ROUTINES)
  const [showGoalModal, setShowGoalModal] = useState(null)
  const [showRoutineModal, setShowRoutineModal] = useState(null)
  const [showCheckIn, setShowCheckIn] = useState(null)
  const [showCheckOut, setShowCheckOut] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showCalExport, setShowCalExport] = useState(false)
  const [lbPeriod, setLbPeriod] = useState("7d")
  const [checkedIn, setCheckedIn] = useState(new Set())
  const [checkInData, setCheckInData] = useState({})
  const [checkOutData, setCheckOutData] = useState({})

  const liveSessions = useMemo(() => MOCK_SESSIONS.filter(s => s.status === "live"), [])

  const toggleSignUp = (id) => {
    setSignedUp(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getSessionStreak = (session) => {
    const d = new Date(session.date + "T00:00:00")
    const dayAbbr = ["So","Mo","Di","Mi","Do","Fr","Sa"][d.getDay()]
    return MOCK_SESSION_STREAKS[`${dayAbbr}-${session.startTime}`]
  }

  // ----- Echte Supabase-Daten -----
  const [realSessions, setRealSessions] = useState([])
  const [realSignedUp, setRealSignedUp] = useState(new Set())
  const [realAttendances, setRealAttendances] = useState([])
  const [realRoutines, setRealRoutines] = useState([])
  const [realLoading, setRealLoading] = useState(false)
  const [realError, setRealError] = useState(null)

  const refreshRealData = useCallback(async () => {
    if (!user?.id) {
      setRealSessions([])
      setRealSignedUp(new Set())
      setRealAttendances([])
      setRealRoutines([])
      return
    }
    setRealLoading(true)
    setRealError(null)
    try {
      const [sessions, signups, attendances, routinesList] = await Promise.all([
        fetchSessions(),
        fetchMySignups(user.id),
        fetchMyAttendances(user.id),
        fetchMyRoutines(user.id),
      ])
      setRealSessions(sessions)
      setRealSignedUp(signups)
      setRealAttendances(attendances)
      setRealRoutines(routinesList)
    } catch (err) {
      console.error('refreshRealData failed:', err)
      setRealError(err.message ?? 'Daten konnten nicht geladen werden')
    } finally {
      setRealLoading(false)
    }
  }, [user?.id])

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
    // legacy mock state
    signedUp, toggleSignUp,
    goals, setGoals,
    routineChecks, setRoutineChecks,
    routines, setRoutines,
    showGoalModal, setShowGoalModal,
    showRoutineModal, setShowRoutineModal,
    showCheckIn, setShowCheckIn,
    showCheckOut, setShowCheckOut,
    showOnboarding, setShowOnboarding,
    showCalExport, setShowCalExport,
    lbPeriod, setLbPeriod,
    checkedIn, setCheckedIn,
    checkInData, setCheckInData,
    checkOutData, setCheckOutData,
    liveSessions,
    getSessionStreak,

    // real data
    realSessions,
    realSignedUp,
    realAttendances,
    realRoutines,
    realLoading,
    realError,
    refreshRealData,
    toggleRealSignUp,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)

import { createContext, useContext, useState, useMemo } from 'react'
import { MOCK_SESSIONS, MOCK_ROUTINES, MOCK_SESSION_STREAKS } from '../data/mockData'

const AppContext = createContext({})

export function AppProvider({ children }) {
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

  const value = {
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
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)

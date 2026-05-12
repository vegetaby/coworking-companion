import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/layout/Sidebar'
import TopNav from './components/layout/TopNav'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import LeaderboardPage from './pages/LeaderboardPage'
import MySessionsPage from './pages/MySessionsPage'
import RoutinesPage from './pages/RoutinesPage'
import AnalysePage from './pages/AnalysePage'
import AdminPage from './pages/AdminPage'
import CheckInModal from './modals/CheckInModal'
import CheckOutModal from './modals/CheckOutModal'
import GoalModal from './modals/GoalModal'
import RoutineModal from './modals/RoutineModal'
import CalExportModal from './modals/CalExportModal'
import OnboardingModal from './modals/OnboardingModal'

const SIDEBAR_KEY = 'cw-sidebar-collapsed'

function Modals() {
  const { showCheckIn, showCheckOut, showGoalModal, showRoutineModal, showCalExport, showOnboarding } = useApp()
  return (
    <>
      {showCheckIn && <CheckInModal />}
      {showCheckOut && <CheckOutModal />}
      {showGoalModal && <GoalModal />}
      {showRoutineModal && <RoutineModal />}
      {showCalExport && <CalExportModal />}
      {showOnboarding && <OnboardingModal />}
    </>
  )
}

function AppLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-accent text-xl font-semibold">Laden...</div>
      </div>
    )
  }

  if (!user && location.pathname === '/') {
    return <LandingPage />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`flex-1 ml-0 transition-[margin] duration-200 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <TopNav onMenuClick={() => setMobileOpen(true)} />
        <main className="p-6 max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/kalender" element={<CalendarPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/sessions" element={<MySessionsPage />} />
            <Route path="/routinen" element={<RoutinesPage />} />
            <Route path="/analyse" element={<AnalysePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
      <Modals />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

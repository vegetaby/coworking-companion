import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
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
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        <TopNav />
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
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  )
}

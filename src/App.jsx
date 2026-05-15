import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/layout/Sidebar'
import TopNav from './components/layout/TopNav'
import { T } from './lib/theme'
import LandingPage from './pages/LandingPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import MySessionsPage from './pages/MySessionsPage'
import RoutinesPage from './pages/RoutinesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AnalysePage from './pages/AnalysePage'
import AdminPage from './pages/AdminPage'
import CheckInModal from './modals/CheckInModal'
import CheckOutModal from './modals/CheckOutModal'
import GoalModal from './modals/GoalModal'
import RoutineModal from './modals/RoutineModal'
import CalExportModal from './modals/CalExportModal'
import OnboardingModal from './modals/OnboardingModal'
import UnfinishedCheckoutModal from './modals/UnfinishedCheckoutModal'

const SIDEBAR_KEY = 'cw-sidebar-collapsed'

// Eigene Loading-Screen-Komponente. Zeigt nach 4 Sek einen Reset-Button,
// falls die Auth-Initialisierung haengen bleibt (z.B. kaputter JWT im
// localStorage). Damit ist der Nutzer nie ohne Eskalation gefangen.
function LoadingScreen() {
  const { resetLocalSession } = useAuth()
  const [showReset, setShowReset] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowReset(true), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-accent text-xl font-semibold">Laden...</div>
      {showReset && (
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <p className="text-text-muted text-sm">
            Dauert es zu lange? Manchmal hilft es, die lokale Sitzung
            zurückzusetzen und sich neu anzumelden.
          </p>
          <button
            onClick={resetLocalSession}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-white hover:opacity-90 transition-opacity"
          >
            Sitzung zurücksetzen & neu laden
          </button>
        </div>
      )}
    </div>
  )
}

// Hinweis-Banner fuer vergessene Check-Outs der letzten 7 Tage.
// Voll-implementiertes Auto-Popup-Modal folgt in Batch 2.
function PendingCheckoutsBanner() {
  const { pendingCheckouts } = useApp()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !pendingCheckouts || pendingCheckouts.length === 0) return null
  const count = pendingCheckouts.length
  return (
    <div
      role="status"
      style={{
        margin: '12px 16px 0',
        padding: '12px 16px',
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.warning}1f, ${T.warning}08)`,
        border: `1px solid ${T.warning}55`,
        color: T.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ fontSize: 14 }}>
        <strong>Du hast {count} offene {count === 1 ? 'Session' : 'Sessions'}.</strong>{' '}
        <span style={{ color: T.textMuted }}>Hol dein Check-Out und die Bewertung nach.</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => navigate('/sessions')}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: 'none',
            background: T.warning,
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Jetzt nachholen
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Hinweis schließen"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.textMuted,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Später
        </button>
      </div>
    </div>
  )
}

function Modals() {
  const { showCheckIn, showCheckOut, showGoalModal, showRoutineModal, showCalExport, showOnboarding, pendingCheckouts } = useApp()
  // Auto-Popup fuer vergessene Check-Outs. Bedingt: User hat pending Eintraege,
  // KEIN anderes Modal ist gerade offen (sonst Stack-Konflikte), und der
  // explizite Check-Out-Flow ist nicht aktiv.
  const showUnfinished = !showCheckIn && !showCheckOut && !showGoalModal &&
    !showRoutineModal && !showCalExport && !showOnboarding &&
    Array.isArray(pendingCheckouts) && pendingCheckouts.length > 0
  return (
    <>
      {showCheckIn && <CheckInModal />}
      {showCheckOut && <CheckOutModal />}
      {showGoalModal && <GoalModal />}
      {showRoutineModal && <RoutineModal />}
      {showCalExport && <CalExportModal />}
      {showOnboarding && <OnboardingModal />}
      {showUnfinished && <UnfinishedCheckoutModal />}
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
    return <LoadingScreen />
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
        <PendingCheckoutsBanner />
        <main className="p-6 max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/kalender" element={<CalendarPage />} />
            <Route path="/sessions" element={<MySessionsPage />} />
            <Route path="/routinen" element={<RoutinesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* Leaderboard/Analyse sind per Feature-Flag in der Sidebar
                versteckt, die Routes selbst bleiben aber erreichbar — so
                koennen Admins per direkter URL testen, bevor sie das Flag
                fuer alle freischalten. */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/analyse" element={<AnalysePage />} />
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
            {/* Reset-Password muss VOR dem Auth-Gate liegen — der User klickt den
                Reset-Link aus der Mail und ist (noch) nicht eingeloggt. Supabase
                tauscht den access_token aus der URL automatisch gegen eine Session. */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

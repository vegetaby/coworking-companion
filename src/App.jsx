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

// Bug-Fix 2 + 3: Loading-Screen.
// - Reset-Button ist IMMER sichtbar, sobald der Loading-Screen erscheint
//   (frueher: erst nach 4s). Wenn jemand mit einem kaputten Token einloggt,
//   soll er nicht erst 4s warten muessen bevor er die Eskalation findet.
// - Fallback-Text ist informativer und wechselt nach Zeit Stufen,
//   damit der Nutzer sieht "OK, das laeuft" und spaeter "OK, das dauert
//   ungewoehnlich lange, ich darf abbrechen".
function LoadingScreen() {
  const { resetLocalSession } = useAuth()
  const [stage, setStage] = useState(0) // 0 = normal, 1 = "dauert laenger", 2 = "definitiv haengt"

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2500)
    const t2 = setTimeout(() => setStage(2), 6000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const stageText = stage === 0
    ? 'Deine Sitzung wird geladen…'
    : stage === 1
      ? 'Das dauert etwas länger als üblich…'
      : 'Hmm, da hängt etwas. Versuch bitte den Reset.'

  return (
    <div
      className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6"
      role="status"
      aria-live="polite"
    >
      {/* Animierter Spinner - signalisiert "App arbeitet" */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `3px solid ${T.border}`,
          borderTopColor: T.accent,
          animation: 'cw-spin 0.9s linear infinite',
        }}
      />
      <style>{`@keyframes cw-spin { to { transform: rotate(360deg); } }`}</style>

      <div className="text-accent text-xl font-semibold">{stageText}</div>

      <p className="text-text-muted text-sm text-center max-w-sm" style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.6 }}>
        Wir prüfen deine Anmeldung und holen dein Profil. Das dauert normalerweise nur einen Moment.
      </p>

      {/* Reset-Button ist IMMER sichtbar (Bug-Fix 2). Bei Stage >=1 visuell
          prominenter, damit es offensichtlicher wird, dass das eine Option ist. */}
      <div className="flex flex-col items-center gap-3 text-center max-w-sm" style={{ marginTop: 8 }}>
        <p style={{ color: T.textMuted, fontSize: 12 }}>
          Sitzung hängt? Lokale Daten zurücksetzen und neu laden.
        </p>
        <button
          onClick={resetLocalSession}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: stage >= 1 ? T.accent : 'transparent',
            color: stage >= 1 ? '#fff' : T.textMuted,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          aria-label="Lokale Sitzung zurücksetzen und Seite neu laden"
        >
          Sitzung zurücksetzen & neu laden
        </button>
      </div>
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

function NotFoundPage() {
  return (
    <div style={{ padding: 48, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800 }}>Seite nicht gefunden</h2>
      <p style={{ color: 'rgba(228,228,237,0.6)' }}>Diese URL existiert nicht. Geh zurück zum Dashboard.</p>
      <a href="/" style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, background: '#7c3aed', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Zurück</a>
    </div>
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
            <Route path="*" element={<NotFoundPage />} />
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

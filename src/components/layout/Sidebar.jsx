import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'home' },
  { path: '/kalender', label: 'Kalender', icon: 'calendar' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { path: '/sessions', label: 'Meine Sessions', icon: 'list' },
  { path: '/routinen', label: 'Fokus-Routinen', icon: 'check' },
  { path: '/analyse', label: 'Analyse', icon: 'chart' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, signOut, profile } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-border-main flex flex-col z-50 hidden md:flex">
      {/* Logo */}
      <div className="p-6 border-b border-border-main">
        <h1 className="text-lg font-bold text-text-main">The CoWorking Space</h1>
        <p className="text-xs text-text-muted mt-1">Companion</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sidebar-active text-accent'
                  : 'text-text-muted hover:text-text-main hover:bg-sidebar-active'
              }`}
            >
              <span className="text-lg">{item.icon === 'home' ? '🏠' : item.icon === 'calendar' ? '📅' : item.icon === 'trophy' ? '🏆' : item.icon === 'list' ? '📋' : item.icon === 'check' ? '✅' : '📊'}</span>
              {item.label}
            </button>
          )
        })}

        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              location.pathname === '/admin'
                ? 'bg-sidebar-active text-accent'
                : 'text-text-muted hover:text-text-main hover:bg-sidebar-active'
            }`}
          >
            <span className="text-lg">⚙️</span>
            Admin
          </button>
        )}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-border-main">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
            {profile?.display_name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-main truncate">{profile?.display_name || 'Nutzer'}</p>
            <p className="text-xs text-text-muted">{profile?.role || 'member'}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
        >
          Abmelden
        </button>
      </div>
    </aside>
  )
}

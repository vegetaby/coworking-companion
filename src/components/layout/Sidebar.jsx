import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Icon from '../ui/Icon'

const navItems = [
  { path: '/', label: 'Dashboard', emoji: '🏠' },
  { path: '/kalender', label: 'Kalender', emoji: '📅' },
  { path: '/leaderboard', label: 'Leaderboard', emoji: '🏆' },
  { path: '/sessions', label: 'Meine Sessions', emoji: '📋' },
  { path: '/routinen', label: 'Fokus-Routinen', emoji: '✅' },
  { path: '/analyse', label: 'Analyse', emoji: '📊' },
]

export default function Sidebar({ collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, signOut, profile } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const navigateAndClose = (path) => {
    navigate(path)
    onCloseMobile?.()
  }

  const widthClass = collapsed ? 'md:w-16' : 'md:w-64'
  const visibilityClass = mobileOpen ? 'flex w-64' : 'hidden'

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-border-main flex-col z-50 transition-[width] duration-200 ${visibilityClass} md:flex ${widthClass}`}
      >
        {/* Logo + Collapse Button */}
        <div className={`p-4 border-b border-border-main flex items-center ${collapsed ? 'md:justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-text-main truncate">The CoWorking Space</h1>
              <p className="text-xs text-text-muted mt-0.5">Companion</p>
            </div>
          )}
          {collapsed && (
            <div className="hidden md:flex w-9 h-9 rounded-lg bg-accent items-center justify-center text-white font-bold text-sm">CW</div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden md:inline-flex p-1.5 rounded-md text-text-muted hover:text-text-main hover:bg-sidebar-active transition-colors"
            aria-label={collapsed ? 'Sidebar aufklappen' : 'Sidebar einklappen'}
            title={collapsed ? 'Sidebar aufklappen' : 'Sidebar einklappen'}
            style={collapsed ? { position: 'absolute', top: 14, right: -14, background: 'rgb(var(--c-sidebar))', border: '1px solid rgb(var(--c-border))', borderRadius: 999, width: 28, height: 28 } : {}}
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
          </button>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-md text-text-muted hover:text-text-main"
            aria-label="Schließen"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigateAndClose(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 ${collapsed ? 'md:justify-center md:px-0' : 'px-4'} py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-active text-accent'
                    : 'text-text-muted hover:text-text-main hover:bg-sidebar-active'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
              </button>
            )
          })}

          {isAdmin && (
            <button
              onClick={() => navigateAndClose('/admin')}
              title={collapsed ? 'Admin' : undefined}
              className={`w-full flex items-center gap-3 ${collapsed ? 'md:justify-center md:px-0' : 'px-4'} py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/admin'
                  ? 'bg-sidebar-active text-accent'
                  : 'text-text-muted hover:text-text-main hover:bg-sidebar-active'
              }`}
            >
              <span className="text-lg flex-shrink-0">⚙️</span>
              <span className={collapsed ? 'md:hidden' : ''}>Admin</span>
            </button>
          )}
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 pb-2">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
            className={`w-full flex items-center gap-3 ${collapsed ? 'md:justify-center md:px-0' : 'px-4'} py-2 rounded-lg text-sm text-text-muted hover:text-text-main hover:bg-sidebar-active transition-colors`}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            <span className={collapsed ? 'md:hidden' : ''}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>

        {/* User + Logout */}
        <div className="p-3 border-t border-border-main">
          <div className={`flex items-center gap-3 mb-2 ${collapsed ? 'md:justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {profile?.display_name?.[0] || '?'}
            </div>
            <div className={`flex-1 min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
              <p className="text-sm font-medium text-text-main truncate">{profile?.display_name || 'Nutzer'}</p>
              <p className="text-xs text-text-muted">{profile?.role || 'member'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            title="Abmelden"
            className={`w-full flex items-center gap-2 ${collapsed ? 'md:justify-center md:px-0' : 'px-4'} py-2 rounded-lg text-sm text-text-muted hover:text-danger hover:bg-danger/10 transition-all`}
          >
            <Icon name="logout" size={16} />
            <span className={collapsed ? 'md:hidden' : ''}>Abmelden</span>
          </button>
        </div>
      </aside>
    </>
  )
}

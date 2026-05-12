import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Icon from '../ui/Icon'

const pageTitles = {
  '/': 'Dashboard',
  '/kalender': 'Kalender',
  '/leaderboard': 'Leaderboard',
  '/sessions': 'Meine Sessions',
  '/routinen': 'Fokus-Routinen',
  '/analyse': 'Analyse',
  '/admin': 'Admin-Bereich',
}

export default function TopNav({ onMenuClick }) {
  const location = useLocation()
  const { profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const title = pageTitles[location.pathname] || 'The CoWorking Space'

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border-main px-6 py-4">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-md text-text-muted hover:text-text-main hover:bg-sidebar-active transition-colors"
            aria-label="Menü öffnen"
          >
            <Icon name="menu" size={20} />
          </button>
          <h2 className="text-xl font-bold text-text-main">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-muted hover:text-text-main hover:bg-sidebar-active transition-colors"
            aria-label={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
          <span className="text-sm text-text-muted hidden sm:block">{profile?.display_name}</span>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
            {profile?.display_name?.[0] || '?'}
          </div>
        </div>
      </div>
    </header>
  )
}

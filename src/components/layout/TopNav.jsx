import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const pageTitles = {
  '/': 'Dashboard',
  '/kalender': 'Kalender',
  '/leaderboard': 'Leaderboard',
  '/sessions': 'Meine Sessions',
  '/routinen': 'Fokus-Routinen',
  '/analyse': 'Analyse',
  '/admin': 'Admin-Bereich',
}

export default function TopNav() {
  const location = useLocation()
  const { profile } = useAuth()
  const title = pageTitles[location.pathname] || 'The CoWorking Space'

  return (
    <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border-main px-6 py-4">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-text-main">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted hidden sm:block">{profile?.display_name}</span>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
            {profile?.display_name?.[0] || '?'}
          </div>
        </div>
      </div>
    </header>
  )
}

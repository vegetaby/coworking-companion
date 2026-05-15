import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import { formatDate } from '../lib/utils'
import Icon from '../components/ui/Icon'
import Tooltip from '../components/ui/Tooltip'

const trimTime = (t) => (typeof t === 'string' ? t.slice(0, 5) : t)

export default function DashboardPage() {
  const { profile } = useAuth()
  const {
    realSessions,
    realSignedUp,
    realAttendances,
    userStreak,
    setShowCheckIn,
    setShowCheckOut,
    setShowGoalModal,
  } = useApp()
  const navigate = useNavigate()

  // Echte Stats statt Mock — alles abgeleitet aus den abgeschlossenen Attendances.
  const completedAttendances = useMemo(
    () => (realAttendances || []).filter(a => a.checked_out_at),
    [realAttendances]
  )
  const totalSessions = completedAttendances.length
  const ratedAttendances = completedAttendances.filter(a => typeof a.rating === 'number')
  const avgRating = ratedAttendances.length > 0
    ? (ratedAttendances.reduce((sum, a) => sum + a.rating, 0) / ratedAttendances.length).toFixed(1)
    : null
  // Streak aus dem AppContext (kommt aus der SQL-Function get_user_streak()).
  // userStreak ist ein Integer >= 0; 0 = keine aktive Streak.
  const streak = typeof userStreak === 'number' ? userStreak : 0
  const streakLabel = streak === 1 ? 'Woche-Streak' : 'Wochen-Streak'

  // Wer hat fuer die aktuelle Live-Session schon eingecheckt?
  const checkedInSessionIds = useMemo(
    () => new Set((realAttendances || []).filter(a => a.checked_in_at).map(a => a.session_id)),
    [realAttendances]
  )

  // Echte Sessions, fuer die der User angemeldet ist und die noch nicht vorbei sind.
  const mySessions = useMemo(() => (
    realSessions
      .filter(s => realSignedUp.has(s.id) && s.status !== 'past' && s.status !== 'cancelled')
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
  ), [realSessions, realSignedUp])

  // Live-Session = Status 'live' (von update_session_statuses() server-seitig gesetzt)
  const liveAndSignedUp = mySessions.find(s => s.status === 'live')

  // Naechste Session: scheduled, und entweder zukuenftiges Datum, oder heute mit start_time in der Zukunft.
  const nextSignedUp = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    // HH:MM:SS in lokaler Zeit
    const pad = (n) => String(n).padStart(2, '0')
    const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    return mySessions.find(s => {
      if (s.status !== 'scheduled') return false
      if (s.date > todayStr) return true
      if (s.date === todayStr && (s.start_time || '') > nowTime) return true
      return false
    })
  }, [mySessions])

  return (
    <div style={S.container}>
      {/* Dynamic Banner */}
      {liveAndSignedUp ? (
        <div style={{
          ...S.card, padding: 20, marginBottom: 24,
          background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))",
          border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: T.danger, animation: "cw-pulse 1.5s infinite" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.danger }}>Laufende Session: {liveAndSignedUp.title}</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>{trimTime(liveAndSignedUp.start_time)} – {trimTime(liveAndSignedUp.end_time)} mit {liveAndSignedUp.host_name}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!checkedInSessionIds.has(liveAndSignedUp.id) ? (
              <button style={S.btn("live")} onClick={() => setShowCheckIn(liveAndSignedUp)}><Icon name="zap" size={16} /> Check-In</button>
            ) : (
              <button style={{ ...S.btn("outline"), borderColor: T.success + "60", color: T.success }} onClick={() => setShowCheckOut(liveAndSignedUp)}><Icon name="check" size={16} /> Check-Out</button>
            )}
          </div>
        </div>
      ) : nextSignedUp ? (
        <div style={{
          ...S.card, padding: 20, marginBottom: 24,
          background: `linear-gradient(135deg, ${T.accentGlow}, rgba(79,70,229,0.04))`,
          border: `1px solid ${T.accent}30`,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", color: T.accentLight }}><Icon name="calendar" size={20} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Naechste Session: {nextSignedUp.title}</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>{formatDate(nextSignedUp.date)} · {trimTime(nextSignedUp.start_time)} – {trimTime(nextSignedUp.end_time)} mit {nextSignedUp.host_name}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btn("sm"), background: T.accentGlow, color: T.accentLight, border: `1px solid ${T.border}` }} onClick={() => setShowGoalModal(nextSignedUp.id)}>Ziel setzen</button>
            <button style={{ ...S.btn("sm"), background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` }} onClick={() => navigate('/kalender')}>Kalender</button>
          </div>
        </div>
      ) : (
        <div style={{ ...S.card, padding: 20, marginBottom: 24, textAlign: "center", color: T.textMuted }}>
          Keine anstehenden Sessions. <button style={{ ...S.btn("sm"), marginLeft: 8, background: T.gradient, color: "#fff", border: "none" }} onClick={() => navigate('/kalender')}>Sessions entdecken</button>
        </div>
      )}

      {/* Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ ...S.h2, marginBottom: 4 }}>Hallo, {profile?.display_name?.split(" ")[0] || "dort"}!</h1>
          <p style={{ color: T.textMuted }}>Dein Fokus-Dashboard</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.warning }}>
          <Icon name="flame" size={28} />
          <span style={{ fontSize: 26, fontWeight: 800 }}>{streak}</span>
          <Tooltip text={streak === 0 ? "Diese Woche eine Session besuchen startet deine Streak" : "Wochen in Folge mit mind. 1 Session"}>
            <span style={{ fontSize: 13, color: T.textMuted, cursor: "help" }}>{streakLabel}</span>
          </Tooltip>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          {
            label: "Sessions besucht",
            value: totalSessions,
            icon: "target",
            color: T.accent,
            hint: totalSessions === 0 ? "Noch keine — komm wieder wenn du Sessions besucht hast" : null,
          },
          {
            label: "Ø Produktivitaet",
            value: avgRating != null ? `${avgRating}/5` : "—",
            icon: "star",
            color: T.warning,
            hint: avgRating == null ? "Erst nach dem ersten Check-Out sichtbar" : null,
          },
          {
            label: "Geplant",
            value: `${mySessions.length} Sessions`,
            icon: "calendar",
            color: T.success,
            hint: mySessions.length === 0 ? "Melde dich im Kalender an" : null,
          },
        ].map((stat, i) => (
          <div key={i} style={{ ...S.card, flex: "1 1 200px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div>
              <Tooltip text={stat.hint ?? stat.label}>
                <div style={{ fontSize: 24, fontWeight: 800, cursor: stat.hint ? "help" : "default" }}>{stat.value}</div>
              </Tooltip>
              <div style={{ fontSize: 13, color: T.textMuted }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights — leerer Zustand, bis genug Daten da sind */}
      <div style={{ ...S.card, padding: 20, background: `linear-gradient(135deg, rgba(16,185,129,0.08), rgba(124,58,237,0.06))`, border: `1px solid ${T.success}25` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.success}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.success }}>
            <Icon name="zap" size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Deine Insights</h3>
        </div>
        <div style={{ padding: "12px 16px", borderRadius: 10, background: T.card, color: T.textMuted, fontSize: 14 }}>
          Noch keine Daten — komm wieder wenn du ein paar Sessions besucht hast. Wir zeigen dir dann deinen produktivsten Slot, die beste Routine und mehr.
        </div>
      </div>
    </div>
  )
}

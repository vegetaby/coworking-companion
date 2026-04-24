import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import { formatDate } from '../lib/utils'
import { MOCK_SESSIONS } from '../data/mockData'
import Icon from '../components/ui/Icon'
import Tooltip from '../components/ui/Tooltip'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { signedUp, liveSessions, setShowCheckIn, setShowCheckOut, setShowGoalModal, checkedIn } = useApp()
  const navigate = useNavigate()

  // TODO: Replace with real data from Supabase
  const streak = 12
  const totalSessions = 52
  const avgRating = 4.2

  const mySessions = MOCK_SESSIONS.filter(s => signedUp.has(s.id) && s.status !== "past")
  const liveAndSignedUp = liveSessions.find(s => signedUp.has(s.id))
  const nextSignedUp = mySessions.find(s => s.status === "scheduled")

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
              <div style={{ fontSize: 13, color: T.textMuted }}>{liveAndSignedUp.startTime} – {liveAndSignedUp.endTime} mit {liveAndSignedUp.host}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!checkedIn.has(liveAndSignedUp.id) ? (
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
              <div style={{ fontSize: 13, color: T.textMuted }}>{formatDate(nextSignedUp.date)} · {nextSignedUp.startTime} – {nextSignedUp.endTime} mit {nextSignedUp.host}</div>
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
          <Icon name="flame" size={28} /><span style={{ fontSize: 26, fontWeight: 800 }}>{streak}</span>
          <Tooltip text="Wochen in Folge mit mind. 1 Session">
            <span style={{ fontSize: 13, color: T.textMuted, cursor: "help" }}>Wochen-Streak</span>
          </Tooltip>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Sessions besucht", value: totalSessions, icon: "target", color: T.accent },
          { label: "Ø Produktivitaet", value: avgRating + "/5", icon: "star", color: T.warning },
          { label: "Geplant", value: mySessions.length + " Sessions", icon: "calendar", color: T.success },
        ].map((s, i) => (
          <div key={i} style={{ ...S.card, flex: "1 1 200px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}><Icon name={s.icon} size={24} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div><div style={{ fontSize: 13, color: T.textMuted }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div style={{ ...S.card, padding: 20, background: `linear-gradient(135deg, rgba(16,185,129,0.08), rgba(124,58,237,0.06))`, border: `1px solid ${T.success}25` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.success}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.success }}><Icon name="zap" size={20} /></div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Deine Insights</h3>
          </div>
          <button style={{ ...S.btn("sm"), background: "transparent", color: T.accentLight, border: `1px solid ${T.border}` }} onClick={() => navigate('/analyse')}>Alle Analysen</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: T.card }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Beste Routine</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>"Handy auf Flugmodus"</div>
            <div style={{ fontSize: 13, color: T.warning, fontWeight: 700, marginTop: 2 }}>4.5 Sterne <span style={{ color: T.textMuted, fontWeight: 400 }}>statt 3.1</span></div>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: T.card }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Produktivster Slot</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Mi 10–12 Uhr</div>
            <div style={{ fontSize: 13, color: T.success, fontWeight: 700, marginTop: 2 }}>Ø 4.6 Sterne</div>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: T.card }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Laengster Slot-Streak</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Mi 6 Uhr Frueh</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><span style={{ color: T.warning }}><Icon name="flame" size={14} /></span><span style={{ fontSize: 13, fontWeight: 700, color: T.warning }}>4x in Folge</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

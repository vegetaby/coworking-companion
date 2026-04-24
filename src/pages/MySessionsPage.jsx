import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import { formatDate } from '../lib/utils'
import { MOCK_SESSIONS, MOCK_ATTENDANCE_HISTORY } from '../data/mockData'
import Icon from '../components/ui/Icon'
import Stars from '../components/ui/Stars'

export default function MySessionsPage() {
  const navigate = useNavigate()
  const { signedUp, toggleSignUp, checkedIn, setShowCheckIn, setShowCheckOut, setShowGoalModal, setShowRoutineModal, goals, getSessionStreak } = useApp()

  const my = MOCK_SESSIONS.filter(s => signedUp.has(s.id) && s.status !== "past")

  return (
    <div style={S.container}>
      <h1 style={{ ...S.h2, marginBottom: 32 }}>Meine Sessions</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Upcoming */}
        <div>
          <h2 style={{ ...S.h3, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={18} /> Angemeldete Sessions
            <span style={{ ...S.badge(T.accent), marginLeft: 4 }}>{my.length}</span>
          </h2>
          {my.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: 40, color: T.textMuted }}>
              Keine Sessions gebucht.
              <br /><button style={{ ...S.btn("primary"), marginTop: 16 }} onClick={() => navigate('/kalender')}>Sessions entdecken</button>
            </div>
          ) : my.map(s => {
            const isLive = s.status === "live"
            const isCheckedInSession = checkedIn.has(s.id)
            const streak = getSessionStreak(s)
            return (
              <div key={s.id} style={{ ...S.card, ...(isLive ? { border: `1px solid ${T.danger}30` } : {}) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    {isLive && <div style={{ display: "inline-flex", alignItems: "center", gap: 4, ...S.badge(T.danger), marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.danger }} /> LIVE</div>}
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title} – {s.host}</div>
                    <div style={{ fontSize: 14, color: T.textMuted }}>{formatDate(s.date)} · {s.startTime}–{s.endTime}</div>
                    {streak && streak.current >= 2 && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 8px", borderRadius: 8, background: `${T.warning}15`, border: `1px solid ${T.warning}20` }}>
                        <Icon name="flame" size={12} /><span style={{ fontSize: 11, fontWeight: 700, color: T.warning }}>{streak.current}x {streak.label}</span>
                      </div>
                    )}
                  </div>
                  <span style={S.badge(T.success)}>Dabei</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {isLive && !isCheckedInSession && <button style={S.btn("live")} onClick={() => setShowCheckIn(s)}><Icon name="zap" size={14} /> Check-In</button>}
                  {isLive && isCheckedInSession && <button style={{ ...S.btn("sm"), background: `${T.success}15`, color: T.success, border: `1px solid ${T.success}40` }} onClick={() => setShowCheckOut(s)}><Icon name="check" size={14} /> Check-Out</button>}
                  <button style={{ ...S.btn("sm"), background: T.accentGlow, color: T.accentLight, border: `1px solid ${T.border}` }} onClick={() => setShowGoalModal(s.id)}>Ziel</button>
                  <button style={{ ...S.btn("sm"), background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` }} onClick={() => setShowRoutineModal(s.id)}>Checkliste</button>
                  <button style={{ ...S.btn("sm"), background: "rgba(239,68,68,0.08)", color: T.danger, border: `1px solid ${T.danger}25` }} onClick={() => toggleSignUp(s.id)}>Abmelden</button>
                </div>
                {goals[s.id] && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: T.accentGlow, fontSize: 14 }}><span style={{ color: T.accentLight, fontWeight: 600 }}>Ziel:</span> {goals[s.id]}</div>}
              </div>
            )
          })}
        </div>

        {/* History */}
        <div>
          <h2 style={{ ...S.h3, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="chart" size={18} /> Letzte Sessions
          </h2>
          {MOCK_ATTENDANCE_HISTORY.map((h, i) => (
            <div key={i} style={{ ...S.card, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{h.title} – {h.host}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{formatDate(h.date)} · {h.startTime} Uhr</div>
                </div>
                <div style={{ textAlign: "center", minWidth: 50 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: h.rating >= 4 ? T.success : h.rating >= 3 ? T.warning : T.danger }}>{h.rating}</div>
                  <Stars rating={h.rating} size={12} />
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 4 }}><span style={{ color: T.accentLight, fontWeight: 600 }}>Ziel:</span> {h.goalBefore}</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}><span style={{ color: T.success, fontWeight: 600 }}>Ergebnis:</span> {h.goalAfter}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {h.routineStates && Object.entries(h.routineStates).map(([label, checked], ri) => (
                    <div key={ri} style={{ width: 8, height: 8, borderRadius: 2, background: checked ? T.success : T.border }} title={label + (checked ? " ✓" : " ✗")} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: T.textMuted }}>
                  {h.routineStates ? Object.values(h.routineStates).filter(Boolean).length + "/" + Object.keys(h.routineStates).length + " Routinen" : "–"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

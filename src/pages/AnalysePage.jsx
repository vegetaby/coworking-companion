import React from 'react'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import { MOCK_ATTENDANCE_HISTORY } from '../data/mockData'
import Icon from '../components/ui/Icon'
import Stars from '../components/ui/Stars'
import Tooltip from '../components/ui/Tooltip'

export default function AnalysePage() {
  const { routines } = useApp()
  const history = MOCK_ATTENDANCE_HISTORY
  const totalSessions = 52
  const avgRating = (history.reduce((s,h) => s+h.rating, 0) / history.length).toFixed(1)
  const avgRoutines = (history.reduce((s,h) => {
    if (!h.routineStates) return s
    const total = Object.keys(h.routineStates).length
    const checked = Object.values(h.routineStates).filter(Boolean).length
    return total > 0 ? s + (checked / total) : s
  }, 0) / history.filter(h => h.routineStates && Object.keys(h.routineStates).length > 0).length * 100).toFixed(0)
  const totalHours = history.reduce((s,h) => s + (h.title.includes("2h") ? 2 : 1), 0)

  const slotStats = [
    { slot: "06:00 Frueh", sessions: 18, avgRating: 4.4 },
    { slot: "10:00 Vormittag", sessions: 22, avgRating: 4.6 },
    { slot: "14:00 Nachmittag", sessions: 7, avgRating: 3.8 },
  ]
  const maxSlotSessions = Math.max(...slotStats.map(s => s.sessions))

  // Temporal routine impact
  const routineImpact = routines.map(r => {
    const relevantSessions = history.filter(h => h.routineStates && r.label in h.routineStates)
    if (relevantSessions.length < 2) return null
    const withSessions = relevantSessions.filter(h => h.routineStates[r.label] === true)
    const withoutSessions = relevantSessions.filter(h => h.routineStates[r.label] === false)
    if (withSessions.length === 0 || withoutSessions.length === 0) return null
    const withRating = +(withSessions.reduce((s, h) => s + h.rating, 0) / withSessions.length).toFixed(1)
    const withoutRating = +(withoutSessions.reduce((s, h) => s + h.rating, 0) / withoutSessions.length).toFixed(1)
    const diff = (withRating - withoutRating).toFixed(1)
    return {
      routine: r.label, withRating, withoutRating,
      diff: (parseFloat(diff) >= 0 ? "+" : "") + diff,
      sessionsAnalyzed: relevantSessions.length,
      withCount: withSessions.length, withoutCount: withoutSessions.length,
      isActive: r.active, activeSince: r.activeSince, activeUntil: r.activeUntil,
    }
  }).filter(Boolean).sort((a, b) => parseFloat(b.diff) - parseFloat(a.diff))

  const weekdayStats = [
    { day: "Mo", sessions: 4 }, { day: "Di", sessions: 8 }, { day: "Mi", sessions: 14 },
    { day: "Do", sessions: 10 }, { day: "Fr", sessions: 8 }, { day: "Sa", sessions: 2 }, { day: "So", sessions: 1 },
  ]
  const maxWd = Math.max(...weekdayStats.map(w => w.sessions))

  return (
    <div style={S.container}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...S.h2, marginBottom: 4 }}><Icon name="pieChart" size={26} /> Analyse</h1>
        <p style={{ color: T.textMuted }}>Tiefe Einblicke in deine Fokus-Gewohnheiten</p>
      </div>

      {/* Overview Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Gesamt-Sessions", value: totalSessions, icon: "target", color: T.accent },
          { label: "Ø Rating", value: avgRating + "/5", icon: "star", color: T.warning },
          { label: "Fokus-Stunden", value: totalHours + "h", icon: "clock", color: T.success },
          { label: "Routine-Quote", value: avgRoutines + "%", icon: "clipboard", color: "#8b5cf6" },
        ].map((s, i) => (
          <div key={i} style={{ ...S.card, flex: "1 1 180px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}><Icon name={s.icon} size={22} /></div>
            <div><div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div><div style={{ fontSize: 12, color: T.textMuted }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Slot Analysis */}
        <div style={S.card}>
          <h3 style={S.h3}>Slot-Analyse</h3>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>Welche Tageszeit passt am besten zu dir?</p>
          {slotStats.map((s, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{s.slot}</span>
                <span style={{ fontSize: 13, color: T.textMuted }}>{s.sessions} Sessions · Ø {s.avgRating}</span>
              </div>
              <div style={S.progressBar}>
                <div style={S.progressFill((s.sessions/maxSlotSessions)*100, s.avgRating >= 4.5 ? T.success : s.avgRating >= 4 ? T.accent : T.warning)} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <Stars rating={Math.round(s.avgRating)} size={12} />
              </div>
            </div>
          ))}
          <div style={{ padding: "12px 16px", borderRadius: 10, background: `${T.success}10`, border: `1px solid ${T.success}20`, marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.success }}>Empfehlung: Vormittag-Slots (10 Uhr)</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Hier hast du die hoechste Ø-Bewertung</div>
          </div>
        </div>

        {/* Weekday Distribution */}
        <div style={S.card}>
          <h3 style={S.h3}>Wochentags-Verteilung</h3>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>An welchen Tagen bist du am aktivsten?</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, marginTop: 8 }}>
            {weekdayStats.map((w, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: w.sessions === maxWd ? T.success : T.text }}>{w.sessions}</span>
                <div style={{ width: "100%", maxWidth: 40, height: `${(w.sessions/maxWd)*100}%`, borderRadius: 6, background: w.sessions === maxWd ? T.gradient : `${T.accent}40`, minHeight: 8, transition: "height 0.3s" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>{w.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Routine Impact */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 4 }}>
          <h3 style={S.h3}>Routine-Impact</h3>
          <Tooltip text="Vergleich: angehakt vs. nicht angehakt — NUR fuer Sessions, in denen die Routine aktiv getrackt wurde.">
            <span style={{ color: T.textMuted, cursor: "help" }}><Icon name="info" size={16} /></span>
          </Tooltip>
        </div>
        <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>Angehakt vs. nicht angehakt — nur im Zeitraum, in dem die Routine aktiv getrackt wurde.</p>
        {routineImpact.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: T.textMuted }}>Noch nicht genuegend Daten.</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto auto", gap: "12px 16px", alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase" }}>Routine</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", textAlign: "center" }}>Ø mit</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", textAlign: "center" }}>Ø ohne</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", textAlign: "center" }}>Effekt</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", textAlign: "center" }}>n</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", textAlign: "center" }}>Zeitraum</div>
              {routineImpact.map((r, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{r.routine}</span>
                    {!r.isActive && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: `${T.textMuted}20`, color: T.textMuted }}>inaktiv</span>}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontWeight: 700, color: T.success }}>{r.withRating}</span>
                    <div style={{ fontSize: 10, color: T.textMuted }}>({r.withCount}x)</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontWeight: 700, color: T.textMuted }}>{r.withoutRating}</span>
                    <div style={{ fontSize: 10, color: T.textMuted }}>({r.withoutCount}x)</div>
                  </div>
                  <span style={{ textAlign: "center", fontWeight: 800, fontSize: 16, color: parseFloat(r.diff) >= 1 ? T.success : parseFloat(r.diff) >= 0.5 ? T.warning : T.textMuted }}>{r.diff}</span>
                  <span style={{ textAlign: "center", fontSize: 12, color: T.textMuted }}>{r.sessionsAnalyzed}</span>
                  <span style={{ textAlign: "center", fontSize: 11, color: T.textMuted }}>
                    {r.activeSince ? new Date(r.activeSince).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) : "–"}
                    {" – "}
                    {r.activeUntil ? new Date(r.activeUntil).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) : "heute"}
                  </span>
                </React.Fragment>
              ))}
            </div>
            {routineImpact.length > 0 && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: `${T.warning}10`, border: `1px solid ${T.warning}20`, marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.warning }}>Top-Routine: "{routineImpact[0]?.routine}"</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>Steigert dein Rating um {routineImpact[0]?.diff} Punkte ({routineImpact[0]?.withCount}x angehakt vs. {routineImpact[0]?.withoutCount}x nicht)</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Monthly Trend */}
      <div style={S.card}>
        <h3 style={S.h3}>Monatlicher Verlauf</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 140, marginTop: 16 }}>
          {[
            { month: "Okt", sessions: 8, rating: 3.5 }, { month: "Nov", sessions: 12, rating: 3.8 },
            { month: "Dez", sessions: 10, rating: 4.0 }, { month: "Jan", sessions: 15, rating: 4.1 },
            { month: "Feb", sessions: 17, rating: 4.2 },
          ].map((m, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{m.sessions}</div>
              <div style={{ fontSize: 10, color: T.warning }}>Ø {m.rating}</div>
              <div style={{ width: "100%", maxWidth: 48, height: `${(m.sessions/17)*100}%`, borderRadius: 8, background: T.gradient, minHeight: 12 }} />
              <span style={{ fontSize: 11, color: T.textMuted }}>{m.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

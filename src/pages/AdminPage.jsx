import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import { formatDate } from '../lib/utils'
import { MOCK_ADMIN_STATS } from '../data/mockData'
import Icon from '../components/ui/Icon'
import {
  fetchAdminCounts,
  fetchPendingHostConfirmations,
  fetchWeeklyTrend,
  fetchTopMembers,
  fetchNoShows,
  fetchInactiveMembers,
  fetchSessionAttendanceStats,
  fetchSlotStats,
} from '../lib/api'

// Sektion "Feature-Sichtbarkeit": Admin schaltet ueber Toggles, welche
// Sidebar-Eintraege fuer alle eingeloggten User sichtbar sind. Wert wird in
// public.feature_flags persistiert; SELECT ist fuer Authenticated erlaubt,
// UPDATE/INSERT nur fuer Admins (RLS in Migration 004).
function FeatureFlagsSection() {
  const { featureFlagRows, featureFlags, setFeatureFlag, refreshFeatureFlags } = useApp()
  const [savedKey, setSavedKey] = useState(null)
  const [errorKey, setErrorKey] = useState(null)
  const [busyKey, setBusyKey] = useState(null)

  // Beim ersten Mount nochmal nachladen, damit der Admin frische Werte sieht
  // (z.B. nach Reload oder wenn ein anderer Admin grade gespeichert hat).
  useEffect(() => {
    refreshFeatureFlags()
  }, [refreshFeatureFlags])

  const handleToggle = async (key) => {
    setErrorKey(null)
    setBusyKey(key)
    try {
      await setFeatureFlag(key, !featureFlags[key])
      setSavedKey(key)
      setTimeout(() => {
        setSavedKey(curr => (curr === key ? null : curr))
      }, 1800)
    } catch (err) {
      console.error('Toggle fehlgeschlagen:', err)
      setErrorKey(key)
    } finally {
      setBusyKey(null)
    }
  }

  const rows = featureFlagRows.length > 0
    ? featureFlagRows
    : Object.keys(featureFlags).map(k => ({ key: k, enabled: featureFlags[k], label: k, description: null }))

  return (
    <div style={{ ...S.card, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${T.accent}20`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: T.accent,
        }}>
          <Icon name="settings" size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Feature-Sichtbarkeit</h3>
          <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
            Steuere, welche Sidebar-Einträge für alle Mitglieder sichtbar sind.
          </p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
        Änderungen wirken nach Reload der Seite für alle User.
      </p>

      {rows.length === 0 ? (
        <p style={{ color: T.textMuted, fontSize: 13 }}>
          Keine Feature-Flags gefunden. Wurde Migration 004 angewendet?
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(row => {
            const enabled = !!featureFlags[row.key]
            const isSaved = savedKey === row.key
            const isError = errorKey === row.key
            const isBusy = busyKey === row.key
            return (
              <label
                key={row.key}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${T.border}`, background: T.bg,
                  cursor: isBusy ? 'wait' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={isBusy}
                    onChange={() => handleToggle(row.key)}
                    style={{ width: 18, height: 18, accentColor: T.accent, flexShrink: 0 }}
                    aria-label={`${row.label} ${enabled ? 'deaktivieren' : 'aktivieren'}`}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{row.label}</div>
                    {row.description && (
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{row.description}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {isError && (
                    <span style={{ fontSize: 12, color: T.danger, fontWeight: 600 }}>
                      Fehler
                    </span>
                  )}
                  {isSaved && !isError && (
                    <span style={{
                      fontSize: 12, color: T.success, fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <Icon name="check" size={14} /> Gespeichert
                    </span>
                  )}
                  <span style={{
                    fontSize: 11, color: enabled ? T.success : T.textMuted,
                    fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                    background: enabled ? `${T.success}15` : `${T.textMuted}15`,
                  }}>
                    {enabled ? 'AN' : 'AUS'}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [liveStats, setLiveStats] = useState(null)
  const [liveWeekly, setLiveWeekly] = useState(null)
  const [liveTopMembers, setLiveTopMembers] = useState(null)
  const [liveNoShows, setLiveNoShows] = useState(null)
  const [liveInactive, setLiveInactive] = useState(null)
  const [liveSessionAtt, setLiveSessionAtt] = useState(null)
  const [liveSlots, setLiveSlots] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchAdminCounts(),
      fetchWeeklyTrend(),
      fetchTopMembers(),
      fetchNoShows(),
      fetchInactiveMembers(),
      fetchSessionAttendanceStats(),
      fetchSlotStats(),
    ])
      .then(([stats, weekly, top, noShows, inactive, sessionAtt, slots]) => {
        if (cancelled) return
        setLiveStats(stats)
        setLiveWeekly(weekly)
        setLiveTopMembers(top)
        setLiveNoShows(noShows)
        setLiveInactive(inactive)
        setLiveSessionAtt(sessionAtt)
        setLiveSlots(slots)
      })
      .catch(err => console.warn('[Admin] aggregate fetch failed', err))
    return () => { cancelled = true }
  }, [])

  const { isAdmin, user } = useAuth()

  const sessionAttendance = liveSessionAtt ?? [
    { id: "s1", title: "1h Focus", date: "2026-03-04", time: "06:00", host: "Marcel", signedUp: 5, attended: 4, noShows: ["Laura K."] },
    { id: "s2", title: "2h Focus", date: "2026-03-04", time: "10:00", host: "Britta", signedUp: 7, attended: 7, noShows: [] },
    { id: "prev1", title: "2h Focus", date: "2026-02-27", time: "06:00", host: "Britta", signedUp: 6, attended: 5, noShows: ["Thomas B."] },
    { id: "prev2", title: "1h Focus", date: "2026-02-26", time: "14:00", host: "Marcel", signedUp: 4, attended: 3, noShows: ["Laura K."] },
    { id: "prev3", title: "2h Focus", date: "2026-02-25", time: "06:00", host: "Britta", signedUp: 8, attended: 7, noShows: ["Thomas B."] },
    { id: "prev4", title: "1h Focus", date: "2026-02-24", time: "14:00", host: "Marcel", signedUp: 5, attended: 4, noShows: ["Anna W."] },
  ]
  const totalSignedUp = sessionAttendance.reduce((s,a) => s + a.signedUp, 0)
  const totalAttended = sessionAttendance.reduce((s,a) => s + a.attended, 0)
  const noShowRate = ((1 - totalAttended / totalSignedUp) * 100).toFixed(1)

  const slotPopularity = [
    { slot: "06:00 Früh", avgSignups: 5.5, avgAttended: 4.8, sessions: 12, trend: "up" },
    { slot: "10:00 Vormittag", avgSignups: 6.2, avgAttended: 5.9, sessions: 18, trend: "up" },
    { slot: "14:00/14:30 Nachmittag", avgSignups: 3.8, avgAttended: 3.2, sessions: 8, trend: "down" },
  ]
  const maxSlotAvg = Math.max(...slotPopularity.map(s => s.avgSignups))

  const noShowMembers = liveNoShows ?? [
    { name: "Laura K.", noShows: 4, totalSessions: 12, rate: "33%", lastNoShow: "2026-03-04" },
    { name: "Thomas B.", noShows: 3, totalSessions: 8, rate: "38%", lastNoShow: "2026-02-27" },
    { name: "Anna W.", noShows: 2, totalSessions: 5, rate: "40%", lastNoShow: "2026-02-24" },
    { name: "Simon R.", noShows: 1, totalSessions: 14, rate: "7%", lastNoShow: "2026-02-18" },
  ]

  // Echte pending Host-Confirmations laden (Push 5: vorher Mock-Array)
  const [pendingConfirmation, setPendingConfirmation] = useState([])
  const [confirmations, setConfirmations] = useState({})
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    fetchPendingHostConfirmations(user.id)
      .then(rows => {
        if (cancelled) return
        setPendingConfirmation(rows)
        const init = {}
        rows.forEach(p => { init[p.session] = new Set(p.confirmed) })
        setConfirmations(init)
      })
      .catch(err => console.warn('[Admin] fetchPendingHostConfirmations failed', err))
    return () => { cancelled = true }
  }, [user?.id])

  const toggleConfirm = (sessionKey, name) => {
    setConfirmations(prev => {
      const s = new Set(prev[sessionKey])
      s.has(name) ? s.delete(name) : s.add(name)
      return { ...prev, [sessionKey]: s }
    })
  }

  if (!isAdmin) return <div style={S.container}><p style={{ color: T.textMuted }}>Kein Zugriff.</p></div>

  return (
    <div style={S.container}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...S.h2, marginBottom: 4 }}>Host-Insights</h1>
        <p style={{ color: T.textMuted }}>Detaillierte Einblicke für Session-Hosts</p>
      </div>

      {/* Feature-Sichtbarkeit (Sidebar-Steuerung) */}
      <FeatureFlagsSection />

      {/* Overview Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { l: "Sessions gesamt", v: liveStats?.totalSessions ?? MOCK_ADMIN_STATS.totalSessions, c: T.accent },
          { l: "Anmeldungen", v: (liveStats?.totalSignups ?? MOCK_ADMIN_STATS.totalAttendances).toLocaleString(), c: T.success },
          { l: "Ø TN/Session", v: liveStats?.avgPerSession ?? MOCK_ADMIN_STATS.avgPerSession, c: T.warning },
          { l: "No-Show-Rate", v: (liveStats?.noShowRate ?? noShowRate) + "%", c: T.danger },
          { l: "Members", v: liveStats?.totalMembers ?? "50", c: "#8b5cf6" },
        ].map((m, i) => (
          <div key={i} style={{ ...S.card, flex: "1 1 150px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.c }}>{m.v}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Pending Confirmation */}
      {pendingConfirmation.length > 0 && (
        <div style={{ ...S.card, marginBottom: 24, background: `linear-gradient(135deg, rgba(245,158,11,0.08), ${T.card})`, border: `1px solid ${T.warning}30` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.warning}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.warning }}><Icon name="clipboard" size={20} /></div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Anwesenheit bestätigen</h3>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Wer war dabei?</p>
            </div>
          </div>
          {pendingConfirmation.map((p, pi) => (
            <div key={pi}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{p.session} · {formatDate(p.date)} · {p.time} Uhr</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {p.signedUp.map(name => {
                  const isConfirmed = confirmations[p.session]?.has(name)
                  return (
                    <button key={name} onClick={() => toggleConfirm(p.session, name)} style={{
                      padding: "8px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                      background: isConfirmed ? `${T.success}15` : `${T.danger}10`,
                      border: `1px solid ${isConfirmed ? T.success + "40" : T.danger + "30"}`,
                      color: isConfirmed ? T.success : T.danger,
                      fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                    }}>
                      {isConfirmed ? <Icon name="check" size={14} /> : <Icon name="x" size={14} />}
                      {name}
                    </button>
                  )
                })}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {confirmations[p.session]?.size || 0} von {p.signedUp.length} bestätigt
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Signups vs Attendance */}
        <div style={S.card}>
          <h3 style={S.h3}>Anmeldungen vs. Teilnahmen</h3>
          {sessionAttendance.slice(0, 6).map((a, i) => {
            const showRate = ((a.attended / a.signedUp) * 100).toFixed(0)
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{a.title} – {a.host} · {formatDate(a.date)}</span>
                  <span style={{ fontSize: 12, color: a.noShows.length > 0 ? T.danger : T.success, fontWeight: 600 }}>{a.attended}/{a.signedUp} ({showRate}%)</span>
                </div>
                <div style={{ display: "flex", gap: 4, height: 8, borderRadius: 4, overflow: "hidden", background: T.border }}>
                  <div style={{ width: `${(a.attended/a.signedUp)*100}%`, background: T.success, borderRadius: "4px 0 0 4px" }} />
                  {a.noShows.length > 0 && <div style={{ width: `${(a.noShows.length/a.signedUp)*100}%`, background: T.danger, borderRadius: "0 4px 4px 0" }} />}
                </div>
                {a.noShows.length > 0 && <div style={{ fontSize: 11, color: T.danger, marginTop: 4 }}>No-Show: {a.noShows.join(", ")}</div>}
              </div>
            )
          })}
        </div>

        {/* Slot Popularity */}
        <div style={S.card}>
          <h3 style={S.h3}>Zeitslot-Analyse</h3>
          {slotPopularity.map((s, i) => (
            <div key={i} style={{ ...S.card, padding: 16, marginBottom: 8, background: T.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.slot}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{s.sessions} Sessions</div>
                </div>
                {s.trend === "up" ? <span style={{ color: T.success }}><Icon name="trendUp" size={16} /></span> : <span style={{ color: T.danger }}><Icon name="trendDown" size={16} /></span>}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Ø Anmeldungen</div>
                  <div style={{ ...S.progressBar, height: 8 }}><div style={S.progressFill((s.avgSignups/maxSlotAvg)*100, T.accent)} /></div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{s.avgSignups}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Ø Tatsächlich da</div>
                  <div style={{ ...S.progressBar, height: 8 }}><div style={S.progressFill((s.avgAttended/maxSlotAvg)*100, T.success)} /></div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: T.success }}>{s.avgAttended}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Weekly Trend */}
        <div style={S.card}>
          <h3 style={S.h3}>Wöchentlicher Trend</h3>
          <div style={{ display: "flex", alignItems: "end", gap: 12, height: 160, marginTop: 16 }}>
            {(liveWeekly ?? MOCK_ADMIN_STATS.weeklyTrend).map((w, i) => {
              const max = Math.max(...(liveWeekly ?? MOCK_ADMIN_STATS.weeklyTrend).map(x => x.count))
              return (<div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{w.count}</span>
                <div style={{ width: "100%", maxWidth: 48, height: `${(w.count/max)*100}%`, borderRadius: 8, background: T.gradient, minHeight: 20 }} />
                <span style={{ fontSize: 11, color: T.textMuted }}>{w.week}</span>
              </div>)
            })}
          </div>
        </div>

        {/* Top Members */}
        <div style={S.card}>
          <h3 style={S.h3}>Top Members</h3>
          {(liveTopMembers ?? MOCK_ADMIN_STATS.topMembers).map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i<4 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{i+1}</span>
                <span>{m.name}</span>
              </div>
              <span style={{ color: T.textMuted }}>{m.sessions} Sessions</span>
            </div>
          ))}
        </div>
      </div>

      {/* No-Show + Inactive */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ ...S.card, background: `linear-gradient(135deg, rgba(239,68,68,0.05), ${T.card})` }}>
          <h3 style={S.h3}>No-Show Tracking</h3>
          {noShowMembers.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < noShowMembers.length-1 ? `1px solid ${T.border}` : "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>{m.totalSessions} Sessions · Zuletzt: {formatDate(m.lastNoShow)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: parseInt(m.rate) > 30 ? T.danger : T.warning }}>{m.noShows}x</div>
                <div style={{ fontSize: 11, color: T.danger }}>({m.rate})</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card, background: `linear-gradient(135deg, rgba(136,136,164,0.05), ${T.card})` }}>
          <h3 style={S.h3}>Inaktive Members</h3>
          {[
            ...(liveInactive ?? MOCK_ADMIN_STATS.dropOff),
            { name: "Anna W.", lastSeen: "2026-02-10", sessions: 5 },
            { name: "Peter F.", lastSeen: "2025-12-20", sessions: 3 },
          ].map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: T.danger }}>Zuletzt: {formatDate(d.lastSeen)} · {d.sessions} Sessions</div>
              </div>
              <button style={{ ...S.btn("sm"), background: "transparent", border: `1px solid ${T.border}`, color: T.textMuted }}>Anschreiben</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

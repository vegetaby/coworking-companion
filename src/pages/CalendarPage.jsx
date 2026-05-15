import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { T, S } from '../lib/theme'
import { formatDateLong } from '../lib/utils'
import Icon from '../components/ui/Icon'

const trimTime = (t) => (typeof t === 'string' ? t.slice(0, 5) : t)

// Adapter: aus realer Session (snake_case + HH:MM:SS) einen Google-Calendar-Link
// bauen. Wir benutzen hier nicht die utils-Funktion, weil die noch auf den alten
// Mock-Feldern arbeitet.
const buildGoogleCalLink = (s) => {
  const startTime = trimTime(s.start_time)
  const endTime = trimTime(s.end_time)
  const start = s.date.replace(/-/g, '') + 'T' + startTime.replace(':', '') + '00'
  const end = s.date.replace(/-/g, '') + 'T' + endTime.replace(':', '') + '00'
  const title = encodeURIComponent(`CoWorking: ${s.title} (${s.host_name})`)
  const details = encodeURIComponent(
    `Fokus Session im CoWorking Space\nHost: ${s.host_name}\nZoom: ${s.zoom_link || 'Link folgt'}`
  )
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&ctz=Europe/Berlin`
}

export default function CalendarPage() {
  const { user } = useAuth()
  const {
    realSessions,
    realSignedUp,
    realLoading,
    realError,
    toggleRealSignUp,
    setShowCheckIn,
    setShowCheckOut,
    setShowCalExport,
  } = useApp()
  const [calView, setCalView] = useState('list')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  // Sessions nach Datum gruppiert (sortiert nach Datum + Startzeit)
  const grouped = useMemo(() => {
    const g = {}
    const sorted = [...realSessions].sort(
      (a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time)
    )
    sorted.forEach(s => {
      if (!g[s.date]) g[s.date] = []
      g[s.date].push(s)
    })
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b))
  }, [realSessions])

  const getWeekDays = (offset) => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }
  const weekDays = getWeekDays(weekOffset)
  const weekLabel = (() => {
    const s = new Date(weekDays[0] + 'T00:00:00')
    const e = new Date(weekDays[6] + 'T00:00:00')
    return `${s.getDate()}.${s.getMonth() + 1}. – ${e.getDate()}.${e.getMonth() + 1}.${e.getFullYear()}`
  })()

  const getMonthData = (offset) => {
    const now = new Date()
    const month = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const year = month.getFullYear()
    const m = month.getMonth()
    const firstDay = new Date(year, m, 1).getDay()
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    const startPad = (firstDay + 6) % 7
    const monthName = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][m]
    return { year, m, daysInMonth, startPad, monthName }
  }
  const monthData = getMonthData(monthOffset)
  const monthDays = []
  for (let i = 0; i < monthData.startPad; i++) monthDays.push(null)
  for (let d = 1; d <= monthData.daysInMonth; d++) monthDays.push(d)

  const SessionCard = ({ session }) => {
    const isLive = session.status === 'live'
    const isSignedUp = realSignedUp.has(session.id)
    return (
      <div style={{
        ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        ...(isLive ? { border: '1px solid rgba(239,68,68,0.3)' } : {}),
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {isLive && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...S.badge(T.danger) }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: T.danger }} /> LIVE</span>}
            <span style={{ fontWeight: 600, fontSize: 16 }}>{session.title}</span>
            <span style={S.badge(session.host_name === 'Britta' ? '#8b5cf6' : '#3b82f6')}>{session.host_name}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, color: T.textMuted, fontSize: 14 }}>
            <span><Icon name="clock" size={14} /> {trimTime(session.start_time)} – {trimTime(session.end_time)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {user && isLive && isSignedUp && (
            <button style={S.btn('live')} onClick={() => setShowCheckIn(session)}><Icon name="zap" size={16} /> Check-In</button>
          )}
          {user && isLive && isSignedUp && (
            <button style={{ ...S.btn('outline'), borderColor: T.success + '60', color: T.success }} onClick={() => setShowCheckOut(session)}><Icon name="check" size={16} /> Check-Out</button>
          )}
          {user && (
            <button style={{
              ...S.btn(isSignedUp ? 'outline' : 'primary'), padding: '10px 20px',
              background: isSignedUp ? 'rgba(16,185,129,0.1)' : T.gradient,
              borderColor: isSignedUp ? T.success : 'transparent',
              color: isSignedUp ? T.success : '#fff',
            }} onClick={() => toggleRealSignUp(session.id)}>
              {isSignedUp ? <><Icon name="check" size={16} /> Dabei</> : 'Ich bin dabei'}
            </button>
          )}
          {user && isSignedUp && (
            <a href={buildGoogleCalLink(session)} target="_blank" rel="noopener noreferrer" title="In Google Calendar uebernehmen" style={{
              ...S.btn('outline'), padding: '10px', borderColor: 'rgba(66,133,244,0.3)',
              background: 'rgba(66,133,244,0.06)', textDecoration: 'none',
            }}>
              <Icon name="google" size={16} />
            </a>
          )}
        </div>
      </div>
    )
  }

  const isEmpty = realSessions.length === 0

  return (
    <div style={S.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ ...S.h2, marginBottom: 4 }}>Session-Kalender</h1>
          <p style={{ color: T.textMuted }}>Alle kommenden Fokus Sessions</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            {[{ k: 'list', l: 'Liste' }, { k: 'week', l: 'Woche' }, { k: 'month', l: 'Monat' }].map(v => (
              <button key={v.k} onClick={() => setCalView(v.k)} style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13,
                background: calView === v.k ? T.accent : 'transparent',
                color: calView === v.k ? '#fff' : T.textMuted, fontWeight: calView === v.k ? 600 : 400,
              }}>{v.l}</button>
            ))}
          </div>
          <button style={{ ...S.btn('outline'), fontSize: 13, padding: '8px 16px' }} onClick={() => setShowCalExport(true)}>
            <Icon name="download" size={16} /> Abonnieren
          </button>
        </div>
      </div>

      {realError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: `${T.danger}15`, border: `1px solid ${T.danger}40`, color: T.danger, fontSize: 14 }}>
          {realError}
        </div>
      )}

      {realLoading && isEmpty && (
        <div style={{ ...S.card, padding: 32, textAlign: 'center', color: T.textMuted }}>Laden…</div>
      )}

      {!realLoading && isEmpty && (
        <div style={{ ...S.card, padding: 32, textAlign: 'center', color: T.textMuted }}>
          Aktuell keine Sessions geplant.
        </div>
      )}

      {/* LIST VIEW */}
      {!isEmpty && calView === 'list' && grouped.map(([date, sessions]) => (
        <div key={date} style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.accentLight, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{formatDateLong(date)}</h3>
          {sessions.map(session => <SessionCard key={session.id} session={session} />)}
        </div>
      ))}

      {/* WEEK VIEW */}
      {!isEmpty && calView === 'week' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button style={{ ...S.btn('outline'), padding: '8px 14px' }} onClick={() => setWeekOffset(w => w - 1)}><Icon name="chevronLeft" size={16} /> Vorherige</button>
            <span style={{ fontWeight: 700, fontSize: 16, color: T.accentLight }}>{weekLabel}</span>
            <button style={{ ...S.btn('outline'), padding: '8px 14px' }} onClick={() => setWeekOffset(w => w + 1)}>Naechste <Icon name="chevronRight" size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {weekDays.map(day => {
              const d = new Date(day + 'T00:00:00')
              const dayName = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()]
              const isToday = day === new Date().toISOString().split('T')[0]
              const daySessions = realSessions.filter(s => s.date === day)
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <div key={day} style={{
                  background: isToday ? T.accentGlow : T.card, borderRadius: 14, padding: 12,
                  border: `1px solid ${isToday ? T.accent + '50' : T.border}`,
                  minHeight: 140, opacity: isWeekend && daySessions.length === 0 ? 0.4 : 1,
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? T.accentLight : T.textMuted, textTransform: 'uppercase' }}>{dayName}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: isToday ? T.accentLight : T.text }}>{d.getDate()}</div>
                  </div>
                  {daySessions.length === 0 ? (
                    <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', marginTop: 16 }}>—</div>
                  ) : daySessions.map(s => {
                    const isLive = s.status === 'live'
                    const isSigned = realSignedUp.has(s.id)
                    return (
                      <div key={s.id} style={{
                        padding: '5px 7px', borderRadius: 8, marginBottom: 6,
                        background: isLive ? 'rgba(239,68,68,0.15)' : isSigned ? `${T.success}15` : T.bg,
                        border: `1px solid ${isLive ? T.danger + '40' : isSigned ? T.success + '30' : T.border}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isLive ? T.danger : T.text, flex: 1 }}>{trimTime(s.start_time)}</div>
                          {user && (
                            <button onClick={(e) => { e.stopPropagation(); toggleRealSignUp(s.id) }} style={{
                              width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${isSigned ? T.success : T.border}`,
                              background: isSigned ? T.success : 'transparent', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0,
                            }} title={isSigned ? 'Abmelden' : 'Ich bin dabei'}>
                              {isSigned ? <Icon name="check" size={12} /> : <Icon name="plus" size={12} />}
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{s.title.replace(' Focus Session', 'h')}</div>
                        <div style={{ fontSize: 10, color: s.host_name === 'Britta' ? '#8b5cf6' : '#3b82f6', fontWeight: 600 }}>{s.host_name}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {!isEmpty && calView === 'month' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button style={{ ...S.btn('outline'), padding: '8px 14px' }} onClick={() => setMonthOffset(m => m - 1)}><Icon name="chevronLeft" size={16} /> Vorheriger</button>
            <span style={{ fontWeight: 700, fontSize: 18, color: T.accentLight }}>{monthData.monthName} {monthData.year}</span>
            <button style={{ ...S.btn('outline'), padding: '8px 14px' }} onClick={() => setMonthOffset(m => m + 1)}>Naechster <Icon name="chevronRight" size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.textMuted, padding: '8px 0', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {monthDays.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} />
              const dateStr = `${monthData.year}-${String(monthData.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const daySessions = realSessions.filter(s => s.date === dateStr)
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              const hasSignedUp = daySessions.some(s => realSignedUp.has(s.id))
              const hasLive = daySessions.some(s => s.status === 'live')
              return (
                <div key={dateStr} style={{
                  background: isToday ? T.accentGlow : T.card, borderRadius: 10, padding: '8px 6px',
                  border: `1px solid ${isToday ? T.accent + '50' : hasLive ? T.danger + '30' : T.border}`,
                  minHeight: 80, position: 'relative',
                }}>
                  <div style={{ fontSize: 14, fontWeight: isToday ? 800 : 600, color: isToday ? T.accentLight : T.text, textAlign: 'center', marginBottom: 4 }}>{day}</div>
                  {daySessions.map(s => {
                    const isSigned = realSignedUp.has(s.id)
                    const isLive = s.status === 'live'
                    return (
                      <div key={s.id} style={{
                        padding: '2px 4px', borderRadius: 6, marginBottom: 3,
                        background: isLive ? `${T.danger}18` : isSigned ? `${T.success}15` : `${T.accent}10`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: isLive ? T.danger : isSigned ? T.success : T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {trimTime(s.start_time)} {s.host_name}
                        </span>
                        {user && (
                          <button onClick={(e) => { e.stopPropagation(); toggleRealSignUp(s.id) }} style={{
                            width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSigned ? T.success : T.border}`,
                            background: isSigned ? T.success : 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0,
                          }}>
                            {isSigned ? <Icon name="check" size={10} /> : <Icon name="plus" size={10} />}
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {hasSignedUp && <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: T.success }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

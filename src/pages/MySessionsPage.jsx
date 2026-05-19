import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import { formatDate, isSessionLive } from '../lib/utils'
import Icon from '../components/ui/Icon'
import Stars from '../components/ui/Stars'

const smBtn = {
  padding: '6px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
}

const trimTime = (t) => (typeof t === 'string' ? t.slice(0, 5) : t)

export default function MySessionsPage() {
  const navigate = useNavigate()
  const {
    realSessions,
    realSignedUp,
    realAttendances,
    realLoading,
    realError,
    toggleRealSignUp,
  } = useApp()

  const upcoming = realSessions
    .filter(s => realSignedUp.has(s.id) && s.status !== 'past')
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))

  const history = realAttendances
    .filter(a => a.checked_out_at && a.session)
    .sort((a, b) => (b.checked_out_at || '').localeCompare(a.checked_out_at || ''))

  return (
    <div style={S.container}>
      <h1 style={{ ...S.h2, marginBottom: 24 }}>Meine Sessions</h1>

      {realError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: `${T.danger}15`, border: `1px solid ${T.danger}40`, color: T.danger, fontSize: 14 }}>
          {realError}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Upcoming */}
        <section>
          <h2 style={{ ...S.h3, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar" size={18} /> Angemeldete Sessions
            <span style={{ ...S.badge(T.accent), marginLeft: 4 }}>{upcoming.length}</span>
          </h2>

          {realLoading && upcoming.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 32, color: T.textMuted }}>
              Laden…
            </div>
          ) : upcoming.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 32, color: T.textMuted }}>
              Keine Sessions gebucht.
              <br />
              <button
                style={{ ...smBtn, marginTop: 14, background: T.gradient, color: '#fff', border: 'none' }}
                onClick={() => navigate('/kalender')}
              >
                Sessions entdecken
              </button>
            </div>
          ) : (
            upcoming.map(s => {
              const isLive = isSessionLive(s)
              return (
                <div key={s.id} style={{ ...S.card, padding: 18, ...(isLive ? { border: `1px solid ${T.danger}30` } : {}) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      {isLive && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...S.badge(T.danger), marginBottom: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.danger }} /> LIVE
                        </div>
                      )}
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
                        {s.title} – {s.host_name}
                      </div>
                      <div style={{ fontSize: 13, color: T.textMuted }}>
                        {formatDate(s.date)} · {trimTime(s.start_time)}–{trimTime(s.end_time)}
                      </div>
                    </div>
                    <span style={{ ...S.badge(T.success), flexShrink: 0 }}>Dabei</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {isLive && s.zoom_link && (
                      <a
                        href={s.zoom_link}
                        target="_blank"
                        rel="noopener"
                        style={{ ...smBtn, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', textDecoration: 'none' }}
                      >
                        <Icon name="zap" size={13} /> Zur Session
                      </a>
                    )}
                    <button
                      style={{ ...smBtn, background: 'rgba(239,68,68,0.08)', color: T.danger, border: `1px solid ${T.danger}25`, marginLeft: 'auto' }}
                      onClick={() => toggleRealSignUp(s.id)}
                    >
                      Abmelden
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* History */}
        <section>
          <h2 style={{ ...S.h3, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="chart" size={18} /> Letzte Sessions
          </h2>

          {realLoading && history.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 32, color: T.textMuted }}>
              Laden…
            </div>
          ) : history.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 32, color: T.textMuted }}>
              Noch keine abgeschlossenen Sessions.
            </div>
          ) : (
            history.map(a => {
              const s = a.session
              const routineStates = a.routine_states || {}
              const routineEntries = Object.entries(routineStates)
              const doneCount = routineEntries.filter(([, v]) => v).length
              return (
                <div key={a.id} style={{ ...S.card, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                        {s.title} – {s.host_name}
                      </div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>
                        {formatDate(s.date)} · {trimTime(s.start_time)} Uhr
                      </div>
                    </div>
                    {a.rating != null && (
                      <div style={{ textAlign: 'center', minWidth: 50, flexShrink: 0 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: a.rating >= 4 ? T.success : a.rating >= 3 ? T.warning : T.danger, lineHeight: 1 }}>
                          {a.rating}
                        </div>
                        <Stars rating={a.rating} size={11} />
                      </div>
                    )}
                  </div>
                  {a.goal_before && (
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 3 }}>
                      <span style={{ color: T.accentLight, fontWeight: 600 }}>Ziel:</span> {a.goal_before}
                    </div>
                  )}
                  {a.goal_after && (
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>
                      <span style={{ color: T.success, fontWeight: 600 }}>Ergebnis:</span> {a.goal_after}
                    </div>
                  )}
                  {routineEntries.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {routineEntries.map(([label, checked], i) => (
                          <div
                            key={i}
                            style={{ width: 8, height: 8, borderRadius: 2, background: checked ? T.success : T.border }}
                            title={label + (checked ? ' ✓' : ' ✗')}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: T.textMuted }}>
                        {doneCount}/{routineEntries.length} Routinen
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}

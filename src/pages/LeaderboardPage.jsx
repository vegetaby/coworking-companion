import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import { MOCK_LEADERBOARD } from '../data/mockData'
import Icon from '../components/ui/Icon'
import Tooltip from '../components/ui/Tooltip'

export default function LeaderboardPage() {
  const { profile } = useAuth()
  const { lbPeriod, setLbPeriod } = useApp()

  const periods = [{key:"7d",label:"7 Tage"},{key:"30d",label:"30 Tage"},{key:"allzeit",label:"Allzeit"}]
  const data = MOCK_LEADERBOARD[lbPeriod]
  const maxS = data[0]?.sessions || 1
  const medals = ["#fbbf24","#9ca3af","#b45309"]

  const trendEl = (t) => t === "up" ? <span style={{color:T.success}}><Icon name="trendUp" size={14}/></span> : t === "down" ? <span style={{color:T.danger}}><Icon name="trendDown" size={14}/></span> : t === "new" ? <span style={S.badge(T.success)}>NEU</span> : <span style={{color:T.textMuted}}>—</span>

  return (
    <div style={S.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ ...S.h2, marginBottom: 4 }}><Icon name="trophy" size={28} /> Leaderboard</h1>
          <p style={{ color: T.textMuted }}>Die aktivsten Members</p>
        </div>
        <div style={{ display: "flex", background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {periods.map(p => (
            <button key={p.key} onClick={() => setLbPeriod(p.key)} style={{
              padding: "10px 20px", border: "none", cursor: "pointer",
              background: lbPeriod === p.key ? T.accent : "transparent",
              color: lbPeriod === p.key ? "#fff" : T.textMuted, fontSize: 14,
              fontWeight: lbPeriod === p.key ? 600 : 400,
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, marginBottom: 40 }}>
        {[data[1],data[0],data[2]].filter(Boolean).map((m, i) => {
          const pos = [1,0,2][i]; const heights = [150,190,120]; const sizes = [60,76,52]
          return (
            <div key={m.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ width: sizes[i], height: sizes[i], borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sizes[i]*0.32, fontWeight: 800, border: `3px solid ${medals[pos]}`, boxShadow: `0 0 20px ${medals[pos]}44` }}>{m.name.charAt(0)}</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                <div style={{ color: T.accentLight, fontWeight: 800, fontSize: 18 }}>{m.sessions}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>Sessions</div>
              </div>
              <div style={{ width: 90, height: heights[i], borderRadius: "12px 12px 0 0", background: `linear-gradient(to top, ${medals[pos]}22, ${medals[pos]}08)`, border: `1px solid ${medals[pos]}33`, borderBottom: "none", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 14, fontSize: 24, fontWeight: 800, color: medals[pos] }}>#{pos+1}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div style={S.card}>
        <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 120px 80px 50px", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>
          <span>#</span>
          <span>Member</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            Sessions
            <Tooltip text="Anzahl besuchter Sessions im gewaehlten Zeitraum"><span style={{ cursor: "help" }}><Icon name="info" size={13} /></span></Tooltip>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            Streak
            <Tooltip text="Wochen in Folge mit mind. 1 Session"><span style={{ cursor: "help" }}><Icon name="info" size={13} /></span></Tooltip>
          </span>
          <span>
            <Tooltip text="Veraenderung gegenueber dem Vorzeitraum"><span style={{ cursor: "help" }}>Trend</span></Tooltip>
          </span>
        </div>
        {data.map((m, i) => (
          <div key={m.name} style={{
            display: "grid", gridTemplateColumns: "50px 1fr 120px 80px 50px", gap: 12,
            padding: "14px 16px", alignItems: "center",
            borderBottom: i < data.length-1 ? `1px solid ${T.border}` : "none",
            background: i < 3 ? `${medals[i]}08` : "transparent",
          }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: i < 3 ? medals[i] : T.textMuted }}>{m.rank}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{m.name.charAt(0)}</div>
              <span style={{ fontWeight: 500 }}>{m.name}</span>
              {profile && m.name.startsWith(profile.display_name?.split(" ")[0] || "---") && <span style={{ ...S.badge(T.accentLight), fontSize: 10 }}>DU</span>}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{m.sessions}</div>
              <div style={{ ...S.progressBar, marginTop: 4 }}><div style={S.progressFill((m.sessions/maxS)*100, i<3 ? medals[i] : T.accent)} /></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: T.warning }}><Icon name="flame" size={14} /> {m.streak}</div>
            {trendEl(m.trend)}
          </div>
        ))}
      </div>
    </div>
  )
}

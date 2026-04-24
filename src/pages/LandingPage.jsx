import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { T, S } from '../lib/theme'
import { formatDate } from '../lib/utils'
import { MOCK_SESSIONS } from '../data/mockData'
import Icon from '../components/ui/Icon'
import Stars from '../components/ui/Stars'
import ImgPlaceholder from '../components/ui/ImgPlaceholder'

export default function LandingPage() {
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      {/* Top Nav for public */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>CW</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>The CoWorking Space</span>
        </div>
        <button style={S.btn("primary")} onClick={signInWithGoogle}>
          <Icon name="google" size={18} /> Mit Google anmelden
        </button>
      </header>

      {/* Hero */}
      <div style={{ padding: "60px 24px 50px", background: `radial-gradient(ellipse at 50% 0%, ${T.accentGlow}, transparent 70%)` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ ...S.badge(T.accentLight), marginBottom: 20 }}>Kostenlose Community</div>
            <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
              Gemeinsam fokussiert.
              <br /><span style={{ background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Gemeinsam produktiv.</span>
            </h1>
            <p style={{ fontSize: 17, color: T.textMuted, marginBottom: 32 }}>
              The CoWorking Space bringt Selbststaendige, Kreative und Macher zusammen – in taeglichen virtuellen Fokus Sessions mit echter Accountability.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="https://www.skool.com/coworking-space-5938" target="_blank" rel="noopener" style={{ ...S.btn("primary"), textDecoration: "none" }}>Jetzt kostenlos beitreten</a>
              <button style={S.btn("outline")} onClick={signInWithGoogle}><Icon name="google" size={18} /> Anmelden</button>
            </div>
          </div>
          <ImgPlaceholder h={340} label="Hero-Bild: Fokus Session Screenshot" />
        </div>
      </div>

      <div style={S.container}>
        {/* Stats Bar */}
        <div style={{ ...S.card, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16, marginBottom: 48 }}>
          {[
            { num: "342", label: "Fokus Sessions", icon: "target" },
            { num: "1.240", label: "Teilnahmen", icon: "users" },
            { num: "50", label: "Community Members", icon: "flame" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: 24, flex: "1 1 180px" }}>
              <div style={{ color: T.accentLight, marginBottom: 8 }}><Icon name={s.icon} size={28} /></div>
              <div style={S.statNum}>{s.num}</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <h2 style={{ ...S.h2, textAlign: "center" }}>Was dich erwartet</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 56 }}>
          {[
            { title: "Taegliche Fokus Sessions", desc: "Strukturiertes Deep Work in 1h- und 2h-Slots mit Check-in und Austausch.", img: "Screenshot: Zoom-Session" },
            { title: "Persoenliches Dashboard", desc: "Streaks, Produktivitaets-Insights und deine Fokus-Statistiken auf einen Blick.", img: "Screenshot: Dashboard" },
            { title: "Fokus-Routinen", desc: "Individuelle Pre-Session-Checkliste fuer maximale Produktivitaet.", img: "Screenshot: Routinen" },
            { title: "Community-Leaderboard", desc: "Freundlicher Wettbewerb – wer schafft die meisten Sessions?", img: "Screenshot: Leaderboard" },
          ].map((f, i) => (
            <div key={i} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <ImgPlaceholder h={180} label={f.img} style={{ borderRadius: "16px 16px 0 0", border: "none", borderBottom: `1px solid ${T.border}` }} />
              <div style={{ padding: 24 }}>
                <h3 style={S.h3}>{f.title}</h3>
                <p style={{ color: T.textMuted, fontSize: 14 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Sessions */}
        <h2 style={S.h2}>Naechste Fokus Sessions</h2>
        <div style={S.grid}>
          {MOCK_SESSIONS.filter(s => s.status !== "past").slice(0, 4).map(session => (
            <div key={session.id} style={{ ...S.card, cursor: "pointer" }} onClick={signInWithGoogle}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={S.badge(session.host === "Britta" ? "#8b5cf6" : "#3b82f6")}>{session.host}</span>
                {session.status === "live" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...S.badge(T.danger) }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.danger, animation: "cw-pulse 1.5s infinite" }} /> LIVE
                  </span>
                )}
              </div>
              <h3 style={{ ...S.h3, marginBottom: 8 }}>{session.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.textMuted, fontSize: 14 }}>
                <Icon name="calendar" size={15} /> {formatDate(session.date)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.textMuted, fontSize: 14, marginTop: 4 }}>
                <Icon name="clock" size={15} /> {session.startTime} – {session.endTime} Uhr
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Subscribe */}
        <div style={{ ...S.card, marginTop: 40, padding: 40, textAlign: "center", background: `linear-gradient(135deg, ${T.card}, #1e1e35)` }}>
          <h2 style={{ ...S.h2, marginBottom: 8 }}>Kalender abonnieren</h2>
          <p style={{ color: T.textMuted, marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
            Alle Fokus Sessions automatisch in deinem Kalender – immer aktuell.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ ...S.btn("outline"), background: "rgba(66,133,244,0.1)", borderColor: "rgba(66,133,244,0.3)" }}><Icon name="google" size={18} /> Google Calendar</button>
            <button style={{ ...S.btn("outline"), background: "rgba(255,255,255,0.05)" }}><Icon name="apple" size={18} /> Apple Calendar</button>
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginTop: 56 }}>
          <h2 style={{ ...S.h2, textAlign: "center" }}>So funktioniert's</h2>
          <div style={{ ...S.grid, marginTop: 24 }}>
            {[
              { step: "1", title: "Community beitreten", desc: "Kostenlos auf Skool registrieren." },
              { step: "2", title: "Sessions waehlen", desc: "Melde dich fuer passende Slots an." },
              { step: "3", title: "Fokus. Wachsen.", desc: "Deep Work mit Gleichgesinnten." },
            ].map((item, i) => (
              <div key={i} style={{ ...S.card, textAlign: "center", padding: 32 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20, fontWeight: 800 }}>{item.step}</div>
                <h3 style={S.h3}>{item.title}</h3>
                <p style={{ color: T.textMuted, fontSize: 14 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ marginTop: 56, marginBottom: 40 }}>
          <h2 style={{ ...S.h2, textAlign: "center" }}>Was unsere Members sagen</h2>
          <div style={{ ...S.grid, marginTop: 24 }}>
            {[
              { name: "Gerd M.", role: "Selbststaendiger Berater", text: "Die Fokus Sessions haben meine Produktivitaet verdoppelt. Endlich nicht mehr allein im Homeoffice!", avatar: "G" },
              { name: "Doris S.", role: "Freelance Designerin", text: "Durch den CoWorking Space habe ich eine echte Routine entwickelt. Jeden Morgen um 9 bin ich dabei.", avatar: "D" },
              { name: "Simon R.", role: "Startup-Gruender", text: "Die Mischung aus Accountability und Community ist genial. Kann ich nur empfehlen!", avatar: "S" },
            ].map((t, i) => (
              <div key={i} style={{ ...S.card, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{t.role}</div>
                  </div>
                </div>
                <p style={{ color: T.textMuted, fontSize: 15, fontStyle: "italic", lineHeight: 1.6 }}>"{t.text}"</p>
                <Stars rating={5} size={14} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

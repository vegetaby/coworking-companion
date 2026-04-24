import { useAuth } from '../context/AuthContext'
import { T, S } from '../lib/theme'
import { formatDate } from '../lib/utils'
import { MOCK_SESSIONS } from '../data/mockData'
import Icon from '../components/ui/Icon'
import Stars from '../components/ui/Stars'

const IMG = {
  hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
  howItWorks: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80',
  benefits: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80',
  testimonials: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1920&q=80',
  cta: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80',
}

const bgSection = (url, overlay = 'rgba(15,15,20,0.75)') => ({
  position: 'relative',
  backgroundImage: `linear-gradient(${overlay}, ${overlay}), url(${url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
})

export default function LandingPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div>
      {/* Top Nav */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(15,15,20,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>CW</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>The CoWorking Space</span>
        </div>
        <button style={S.btn("primary")} onClick={signInWithGoogle}>
          <Icon name="google" size={18} /> Mit Google anmelden
        </button>
      </header>

      {/* Hero with full background image */}
      <div style={{ ...bgSection(IMG.hero, 'rgba(15,15,20,0.55)'), minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: 800 }}>
          <div style={{ ...S.badge(T.accentLight), margin: '0 auto 24px', display: 'inline-flex' }}>Kostenlose Community</div>
          <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.12, marginBottom: 20 }}>
            Schluss mit Prokrastination.
            <br /><span style={{ background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Gemeinsam fokussiert arbeiten.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(228,228,237,0.8)', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Tritt der kostenlosen Skool CoWorking Community bei und arbeite in fokussierten Live-Sessions gemeinsam mit anderen – per Zoom, ohne Smalltalk.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://www.skool.com/coworking-space-5938" target="_blank" rel="noopener" style={{ ...S.btn("primary"), textDecoration: "none", padding: '14px 32px', fontSize: 16 }}>Kostenlos beitreten</a>
            <button style={{ ...S.btn("outline"), padding: '14px 32px', fontSize: 16 }} onClick={signInWithGoogle}><Icon name="google" size={18} /> Anmelden</button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: T.bg, padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16 }}>
          {[
            { num: "342", label: "Fokus Sessions", icon: "target" },
            { num: "1.240", label: "Teilnahmen", icon: "users" },
            { num: "50", label: "Community Members", icon: "flame" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: 24, flex: "1 1 180px" }}>
              <div style={{ color: T.accentLight, marginBottom: 8 }}><Icon name={s.icon} size={28} /></div>
              <div style={{ fontSize: 36, fontWeight: 800, background: T.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features / Was dich erwartet */}
      <div style={{ ...bgSection(IMG.benefits, 'rgba(15,15,20,0.82)'), padding: '72px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>Was dich erwartet</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            {[
              { icon: "target", title: "Taegliche Fokus Sessions", desc: "Strukturiertes Deep Work in 1h- und 2h-Slots mit Check-in und Austausch." },
              { icon: "pieChart", title: "Persoenliches Dashboard", desc: "Streaks, Produktivitaets-Insights und deine Fokus-Statistiken auf einen Blick." },
              { icon: "clipboard", title: "Fokus-Routinen", desc: "Individuelle Pre-Session-Checkliste fuer maximale Produktivitaet." },
              { icon: "trophy", title: "Community-Leaderboard", desc: "Freundlicher Wettbewerb – wer schafft die meisten Sessions?" },
            ].map((f, i) => (
              <div key={i} style={{ background: 'rgba(26,26,36,0.7)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: 28, border: `1px solid ${T.border}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: T.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accentLight, marginBottom: 16 }}>
                  <Icon name={f.icon} size={24} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div style={{ background: T.bg, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>Naechste Fokus Sessions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {MOCK_SESSIONS.filter(s => s.status !== "past").slice(0, 4).map(session => (
              <div key={session.id} style={{ ...S.card, cursor: "pointer", transition: 'transform 0.2s' }} onClick={signInWithGoogle}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={S.badge(session.host === "Britta" ? "#8b5cf6" : "#3b82f6")}>{session.host}</span>
                  {session.status === "live" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...S.badge(T.danger) }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.danger }} /> LIVE
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
        </div>
      </div>

      {/* So funktioniert's */}
      <div style={{ ...bgSection(IMG.howItWorks, 'rgba(15,15,20,0.8)'), padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>So funktioniert's</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { step: "1", title: "Community beitreten", desc: "Kostenlos auf Skool registrieren und dem CoWorking Space beitreten." },
              { step: "2", title: "Sessions waehlen", desc: "Melde dich fuer passende Fokus-Slots an – taeglich mehrere zur Auswahl." },
              { step: "3", title: "Fokus. Wachsen.", desc: "Check-in, Deep Work mit Gleichgesinnten, Check-out. Fertig." },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(26,26,36,0.6)', backdropFilter: 'blur(8px)', borderRadius: 16, textAlign: 'center', padding: 36, border: `1px solid ${T.border}` }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22, fontWeight: 800 }}>{item.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ ...bgSection(IMG.testimonials, 'rgba(15,15,20,0.82)'), padding: '72px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>Was unsere Members sagen</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { name: "Gerd M.", role: "Selbststaendiger Berater", text: "Die Fokus Sessions haben meine Produktivitaet verdoppelt. Endlich nicht mehr allein im Homeoffice!", avatar: "G" },
              { name: "Doris S.", role: "Freelance Designerin", text: "Durch den CoWorking Space habe ich eine echte Routine entwickelt. Jeden Morgen um 9 bin ich dabei.", avatar: "D" },
              { name: "Simon R.", role: "Startup-Gruender", text: "Die Mischung aus Accountability und Community ist genial. Kann ich nur empfehlen!", avatar: "S" },
            ].map((t, i) => (
              <div key={i} style={{ background: 'rgba(26,26,36,0.7)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: 28, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{t.role}</div>
                  </div>
                </div>
                <p style={{ color: 'rgba(228,228,237,0.85)', fontSize: 15, fontStyle: "italic", lineHeight: 1.7 }}>"{t.text}"</p>
                <div style={{ marginTop: 12 }}><Stars rating={5} size={14} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ ...bgSection(IMG.cta, 'rgba(15,15,20,0.6)'), padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Bereit fuer fokussiertes Arbeiten?</h2>
          <p style={{ fontSize: 17, color: 'rgba(228,228,237,0.8)', marginBottom: 36, lineHeight: 1.7 }}>
            Tritt jetzt der kostenlosen Community bei und erlebe den Unterschied, den gemeinsames Arbeiten macht.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://www.skool.com/coworking-space-5938" target="_blank" rel="noopener" style={{ ...S.btn("primary"), textDecoration: "none", padding: '16px 36px', fontSize: 17 }}>Kostenlos beitreten</a>
            <button style={{ ...S.btn("outline"), padding: '16px 36px', fontSize: 17 }} onClick={signInWithGoogle}><Icon name="google" size={18} /> Anmelden</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: T.sidebar, padding: '32px 24px', textAlign: 'center', borderTop: `1px solid ${T.border}` }}>
        <p style={{ color: T.textMuted, fontSize: 13 }}>© 2026 The CoWorking Space. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  )
}

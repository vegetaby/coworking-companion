import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'
import ImgPlaceholder from '../components/ui/ImgPlaceholder'

export default function OnboardingModal() {
  const { setShowOnboarding } = useApp()

  return (
    <div style={S.modal} onClick={() => setShowOnboarding(false)}>
      <div style={{ ...S.modalContent, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="target" size={32} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Willkommen im CoWorking Space!</h2>
          <p style={{ color: T.textMuted, fontSize: 15 }}>So holst du das Beste aus deinen Fokus Sessions:</p>
        </div>

        {[
          { icon: "calendar", title: "1. Sessions auswaehlen", desc: "Geh zum Kalender und klick 'Ich bin dabei' bei den Sessions, die passen." },
          { icon: "clipboard", title: "2. Fokus-Routinen einrichten", desc: "Erstelle deine persoenliche Pre-Session-Checkliste unter 'Fokus-Routinen'." },
          { icon: "zap", title: "3. Check-In & Check-Out", desc: "Bei laufenden Sessions erscheint ein Quick Check-In – setz dein Ziel in 1 Minute." },
          { icon: "pieChart", title: "4. Analyse nutzen", desc: "Verfolge deine Produktivitaet, Slot-Praeferenzen und Routine-Impact." },
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "start" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", color: T.accentLight, flexShrink: 0 }}>
              <Icon name={step.icon} size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{step.title}</div>
              <div style={{ fontSize: 14, color: T.textMuted }}>{step.desc}</div>
            </div>
          </div>
        ))}

        <ImgPlaceholder h={140} label="Video-Tutorial: So nutzt du den CoWorking Space" style={{ marginTop: 16, marginBottom: 20 }} />

        <button style={{ ...S.btn("primary"), width: "100%", justifyContent: "center" }} onClick={() => setShowOnboarding(false)}>
          Los geht's!
        </button>
      </div>
    </div>
  )
}

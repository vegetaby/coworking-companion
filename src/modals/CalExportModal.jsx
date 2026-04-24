import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'

export default function CalExportModal() {
  const { setShowCalExport } = useApp()

  return (
    <div style={S.modal} onClick={() => setShowCalExport(false)}>
      <div style={{ ...S.modalContent, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ ...S.h3, margin: 0 }}>Kalender abonnieren</h3>
          <button style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }} onClick={() => setShowCalExport(false)}><Icon name="x" size={20} /></button>
        </div>
        <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 24 }}>
          Abonniere den CoWorking-Kalender, damit alle Sessions automatisch in deinem Kalender erscheinen.
        </p>

        <div style={{ ...S.card, padding: 16, marginBottom: 12, cursor: "pointer", border: `1px solid rgba(66,133,244,0.3)`, background: "rgba(66,133,244,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="google" size={24} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Google Calendar</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Klicke, um den Kalender in Google Calendar zu oeffnen</div>
            </div>
          </div>
        </div>

        <div style={{ ...S.card, padding: 16, marginBottom: 12, cursor: "pointer", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="apple" size={24} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Apple Calendar</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Oeffnet den Kalender in Apple Kalender / iCal</div>
            </div>
          </div>
        </div>

        <div style={{ ...S.card, padding: 16, cursor: "pointer", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="link" size={20} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>iCal-Link kopieren</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Fuer Outlook oder andere Kalender-Apps</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: T.accentGlow, fontSize: 13, color: T.textMuted }}>
          <Icon name="info" size={14} /> Der Kalender aktualisiert sich automatisch.
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'

export default function CheckOutModal() {
  const { showCheckOut: s, setShowCheckOut, checkInData, setCheckOutData } = useApp()
  const [result, setResult] = useState("")
  const [rating, setRating] = useState(0)

  return (
    <div style={S.modal} onClick={() => setShowCheckOut(null)}>
      <div style={{ ...S.modalContent, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 12, background: `${T.success}15`, marginBottom: 16 }}>
            <Icon name="check" size={16} />
            <span style={{ fontWeight: 700, color: T.success }}>Quick Check-Out</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Session geschafft!</h2>
          {checkInData[s?.id]?.goal && <p style={{ color: T.accentLight, fontSize: 14 }}>Dein Ziel: "{checkInData[s?.id]?.goal}"</p>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "block" }}>Was hast du erreicht?</label>
          <textarea style={S.textarea} value={result} onChange={e => setResult(e.target.value)} placeholder="z.B. 2 von 3 Kapiteln geschafft..." rows={2} />
        </div>

        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "block" }}>Wie produktiv war die Session?</label>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[1,2,3,4,5].map(i => (
              <button key={i} onClick={() => setRating(i)} style={{
                width: 52, height: 52, borderRadius: 12, border: `2px solid ${i <= rating ? T.warning : T.border}`,
                background: i <= rating ? `${T.warning}18` : T.bg, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: i <= rating ? T.warning : T.textMuted, fontSize: 20, transition: "all 0.15s",
              }}>
                <Icon name={i <= rating ? "star" : "starEmpty"} size={24} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn("outline"), flex: 1, justifyContent: "center" }} onClick={() => setShowCheckOut(null)}>Spaeter</button>
          <button style={{ ...S.btn("primary"), flex: 2, justifyContent: "center" }} onClick={() => {
            setCheckOutData(d => ({...d, [s.id]: { result, rating }}))
            setShowCheckOut(null)
          }}>
            <Icon name="send" size={16} /> Abschliessen
          </button>
        </div>
      </div>
    </div>
  )
}

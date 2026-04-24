import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { T, S } from '../lib/theme'
import Icon from '../components/ui/Icon'

export default function GoalModal() {
  const { showGoalModal, setShowGoalModal, goals, setGoals } = useApp()
  const [text, setText] = useState(goals[showGoalModal] || "")

  return (
    <div style={S.modal} onClick={() => setShowGoalModal(null)}>
      <div style={S.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={S.h3}>Session-Ziel</h3>
          <button style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }} onClick={() => setShowGoalModal(null)}><Icon name="x" size={20} /></button>
        </div>
        <textarea style={S.textarea} value={text} onChange={e => setText(e.target.value)} placeholder="Was moechtest du schaffen?" />
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button style={S.btn("outline")} onClick={() => setShowGoalModal(null)}>Abbrechen</button>
          <button style={S.btn("primary")} onClick={() => { setGoals(g => ({...g, [showGoalModal]: text})); setShowGoalModal(null) }}>Speichern</button>
        </div>
      </div>
    </div>
  )
}

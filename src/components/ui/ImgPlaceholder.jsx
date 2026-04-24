import { T } from '../../lib/theme'
import Icon from './Icon'

const ImgPlaceholder = ({ h = 200, label = "Bild", style = {} }) => (
  <div style={{
    height: h, background: `linear-gradient(135deg, ${T.card}, #1e1e35)`,
    borderRadius: 16, border: `1px dashed ${T.border}`,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 8, color: T.textMuted, ...style,
  }}>
    <Icon name="image" size={32} />
    <span style={{ fontSize: 13 }}>{label}</span>
  </div>
);

export default ImgPlaceholder;

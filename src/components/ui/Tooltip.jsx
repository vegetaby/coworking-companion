import { useState } from 'react'
import { T } from '../../lib/theme'

const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          padding: "8px 12px", borderRadius: 8, background: "#2a2a40", color: T.text, fontSize: 12,
          whiteSpace: "nowrap", zIndex: 999, border: `1px solid ${T.border}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)", lineHeight: 1.4,
        }}>{text}</div>
      )}
    </span>
  );
};

export default Tooltip;

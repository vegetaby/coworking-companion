import Icon from './Icon'
import { T } from '../../lib/theme'

const Stars = ({ rating, onRate, size = 18 }) => (
  <span style={{ display: "inline-flex", gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} onClick={() => onRate?.(i)} style={{ color: T.warning, cursor: onRate ? "pointer" : "default" }}>
        <Icon name={i <= rating ? "star" : "starEmpty"} size={size} />
      </span>
    ))}
  </span>
);

export default Stars;

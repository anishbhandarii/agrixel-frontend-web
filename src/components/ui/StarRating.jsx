import { useState } from 'react'

const StarRating = ({ value = 0, onChange, readonly = false, size = 24 }) => {
  const [hover, setHover] = useState(0)

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize: size,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hover || value) ? '#fbbf24' : 'var(--border)',
            transition: 'color 0.1s, transform 0.1s',
            transform: !readonly && star <= hover ? 'scale(1.2)' : 'scale(1)',
            display: 'inline-block',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default StarRating

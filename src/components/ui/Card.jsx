const PADDING_STYLES = {
  sm: { padding: '12px' },
  md: { padding: '20px' },
  lg: { padding: '28px' },
}

const Card = ({ children, glowOnHover = false, padding = 'md', style: extraStyle = {}, ...props }) => {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
        ...PADDING_STYLES[padding],
        ...extraStyle,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card

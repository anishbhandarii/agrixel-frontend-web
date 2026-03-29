const VARIANT_STYLES = {
  success: { background: 'var(--primary-dim)', color: 'var(--primary)' },
  warning: { background: 'var(--warning-dim)', color: 'var(--warning)' },
  danger:  { background: 'var(--danger-dim)',  color: 'var(--danger)'  },
  neutral: { background: 'var(--surface-2)',   color: 'var(--muted)'   },
}

const Badge = ({ children, variant = 'neutral', style: extraStyle = {} }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        ...VARIANT_STYLES[variant],
        ...extraStyle,
      }}
    >
      {children}
    </span>
  )
}

export default Badge

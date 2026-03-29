const VARIANT_STYLES = {
  primary:   { background: 'var(--primary)',   color: 'var(--bg)',   border: 'none' },
  secondary: { background: 'transparent',      color: 'var(--primary)', border: '1px solid var(--primary)' },
  danger:    { background: 'var(--danger)',     color: 'var(--bg)',   border: 'none' },
}

const SIZE_STYLES = {
  sm: { padding: '6px 12px',  fontSize: '13px' },
  md: { padding: '10px 20px', fontSize: '14px' },
  lg: { padding: '12px 28px', fontSize: '16px' },
}

const Spinner = () => (
  <svg style={{ animation: 'spin 0.8s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
    <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style: extraStyle = {},
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '8px',
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
        width: fullWidth ? '100%' : undefined,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...extraStyle,
      }}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export default Button

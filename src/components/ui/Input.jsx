const Input = ({ label, error, icon: Icon, style: extraStyle = {}, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text)',
          fontFamily: 'Inter, sans-serif',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted)',
          }}>
            <Icon size={16} />
          </div>
        )}
        <input
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: '8px',
            padding: Icon ? '10px 16px 10px 40px' : '10px 16px',
            fontSize: '14px',
            color: 'var(--text)',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease',
            ...extraStyle,
          }}
          {...props}
        />
      </div>
      {error && (
        <p style={{ fontSize: '12px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default Input

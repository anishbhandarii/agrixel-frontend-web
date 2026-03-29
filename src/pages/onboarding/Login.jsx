import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import logo from '../../assets/logo.png'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()

  const { isMobile } = useBreakpoint()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Email is required.'); return }
    if (!password) { setError('Password is required.'); return }

    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      navigate(user.role === 'admin' ? '/admin/overview' : '/farmer/diagnose', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid email or password.'
      setError(typeof msg === 'string' ? msg : 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (focused) => ({
    width: '100%',
    height: '48px',
    padding: '0 16px',
    background: 'var(--bg)',
    border: `1px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  })

  return (
    <>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::placeholder { color: var(--muted-2); }
        .login-submit:hover:not(:disabled) { background: #22c55e !important; }
        .login-link:hover { color: var(--primary) !important; }
        .login-forgot:hover { opacity: 0.8; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: isMobile ? 'flex-start' : undefined,
        paddingTop: isMobile ? '0' : '80px',
        paddingBottom: isMobile ? '0' : '40px',
        paddingLeft: isMobile ? '0' : '16px',
        paddingRight: isMobile ? '0' : '16px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '420px',
          animation: 'fadeUp 0.35s ease forwards',
        }}>

          {/* Card */}
          <div style={{
            background: 'var(--surface)',
            border: isMobile ? 'none' : '1px solid var(--border)',
            borderRadius: isMobile ? '0' : '16px',
            padding: isMobile ? '32px 24px' : '40px',
            minHeight: isMobile ? '100vh' : 'auto',
            boxSizing: 'border-box',
          }}>

            {/* Logo */}
            <img
              src={logo}
              alt="Agrixel"
              style={{
                width: '180px',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto 8px auto',
              }}
            />

            {/* Heading */}
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text)',
              marginTop: '28px',
            }}>
              {t('welcome_back')}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--muted)',
              marginTop: '6px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {t('sign_in_continue')}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>

              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--muted)',
                  marginBottom: '6px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  Email
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle(emailFocused)}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '6px' }}>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--muted)',
                  marginBottom: '6px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  Password
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ ...inputStyle(passwordFocused), paddingRight: '56px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="login-forgot"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: '12px',
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {t('forgot_password')}
                </span>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: '20px',
                  background: 'var(--danger-dim)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit"
                style={{
                  width: '100%',
                  height: '48px',
                  marginTop: '24px',
                  background: 'var(--primary)',
                  color: 'var(--bg)',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background 0.2s ease, opacity 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
                    <circle cx="12" cy="12" r="10" stroke="#0a0f0a" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#0a0f0a" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? t('signing_in') : t('sign_in')}
              </button>

              {/* Register link */}
              <div style={{
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--muted)',
                fontFamily: 'Inter, sans-serif',
                marginTop: '24px',
              }}>
                {t('dont_have_account')}{' '}
                <span
                  className="login-link"
                  onClick={() => navigate('/register')}
                  style={{ color: 'var(--primary)', cursor: 'pointer', transition: 'color 0.15s ease' }}
                >
                  {t('register')}
                </span>
              </div>

              {/* Change language */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <span
                  onClick={() => navigate('/language')}
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {t('change_language')}
                </span>
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login

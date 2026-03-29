import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import logo from '../../assets/logo.png'

const LANGUAGES = [
  { code: 'english', flag: '🇬🇧', label: 'English' },
  { code: 'hindi',   flag: '🇮🇳', label: 'हिंदी' },
  { code: 'nepali',  flag: '🇳🇵', label: 'नेपाली' },
  { code: 'french',  flag: '🇫🇷', label: 'Français' },
  { code: 'german',  flag: '🇩🇪', label: 'Deutsch' },
  { code: 'korean',  flag: '🇰🇷', label: '한국어' },
  { code: 'chinese', flag: '🇨🇳', label: '中文' },
]

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useTranslation()

  const { isMobile } = useBreakpoint()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [language, setLanguage] = useState(localStorage.getItem('agrixel_language') || 'english')
  const [region, setRegion] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Focus states
  const [focused, setFocused] = useState({})
  const setFocus = (name, val) => setFocused(f => ({ ...f, [name]: val }))

  const inputStyle = (name, extra = {}) => ({
    width: '100%',
    height: '48px',
    padding: '0 16px',
    background: 'var(--bg)',
    border: `1px solid ${focused[name] ? 'var(--primary)' : fieldErrors[name] ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
    ...extra,
  })

  const labelStyle = {
    fontSize: '13px',
    color: 'var(--muted)',
    marginBottom: '6px',
    fontFamily: 'Inter, sans-serif',
    display: 'block',
  }

  const fieldErrorStyle = {
    fontSize: '12px',
    color: 'var(--danger)',
    marginTop: '4px',
    fontFamily: 'Inter, sans-serif',
  }

  const validate = () => {
    const errs = {}
    if (!fullName.trim() || fullName.trim().length < 2)
      errs.fullName = 'Full name must be at least 2 characters.'
    if (!email.trim() || !email.includes('@'))
      errs.email = 'Enter a valid email address.'
    if (!password || password.length < 8)
      errs.password = 'Password must be at least 8 characters.'
    if (confirmPassword !== password)
      errs.confirmPassword = 'Passwords do not match.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      await register(email.trim(), password, fullName.trim(), language, region.trim() || undefined)
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

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
        .reg-submit:hover:not(:disabled) { background: #22c55e !important; }
        .reg-link:hover { color: #22c55e !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: isMobile ? 'flex-start' : undefined,
        paddingTop: isMobile ? '0' : '60px',
        paddingBottom: isMobile ? '0' : '60px',
        paddingLeft: isMobile ? '0' : '16px',
        paddingRight: isMobile ? '0' : '16px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '420px',
          animation: 'fadeUp 0.35s ease forwards',
        }}>
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

            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text)',
              marginTop: '28px',
            }}>
              {t('create_account')}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--muted)',
              marginTop: '6px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {t('join_today')}
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>

              {/* Full Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{t('full_name')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onFocus={() => setFocus('fullName', true)}
                  onBlur={() => setFocus('fullName', false)}
                  placeholder="Ram Kumar"
                  autoComplete="name"
                  style={inputStyle('fullName')}
                />
                {fieldErrors.fullName && <div style={fieldErrorStyle}>{fieldErrors.fullName}</div>}
              </div>

              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocus('email', true)}
                  onBlur={() => setFocus('email', false)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle('email')}
                />
                {fieldErrors.email && <div style={fieldErrorStyle}>{fieldErrors.email}</div>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{t('password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocus('password', true)}
                    onBlur={() => setFocus('password', false)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    style={inputStyle('password', { paddingRight: '56px' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
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
                {fieldErrors.password && <div style={fieldErrorStyle}>{fieldErrors.password}</div>}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{t('confirm_password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocus('confirmPassword', true)}
                    onBlur={() => setFocus('confirmPassword', false)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    style={inputStyle('confirmPassword', { paddingRight: '56px' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
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
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <div style={fieldErrorStyle}>{fieldErrors.confirmPassword}</div>}
              </div>

              {/* Preferred Language */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{t('preferred_language')}</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  onFocus={() => setFocus('language', true)}
                  onBlur={() => setFocus('language', false)}
                  style={{
                    ...inputStyle('language'),
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: '36px',
                    cursor: 'pointer',
                  }}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                      {l.flag} {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{t('region')}</label>
                <input
                  type="text"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  onFocus={() => setFocus('region', true)}
                  onBlur={() => setFocus('region', false)}
                  placeholder="e.g. Kathmandu, Nepal"
                  style={inputStyle('region')}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginBottom: '16px',
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
                className="reg-submit"
                style={{
                  width: '100%',
                  height: '48px',
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
                    <circle cx="12" cy="12" r="10" stroke="#0a0f0a" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#0a0f0a" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? t('creating_account') : t('create_account')}
              </button>

              {/* Login link */}
              <div style={{
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--muted)',
                fontFamily: 'Inter, sans-serif',
                marginTop: '24px',
              }}>
                {t('already_have_account')}{' '}
                <span
                  className="reg-link"
                  onClick={() => navigate('/login')}
                  style={{ color: 'var(--primary)', cursor: 'pointer', transition: 'color 0.15s ease' }}
                >
                  {t('sign_in')}
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

export default Register

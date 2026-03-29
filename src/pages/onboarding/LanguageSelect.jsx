import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import i18n from '../../i18n/index'
import client from '../../api/client'
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

const LanguageSelect = () => {
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const [selected, setSelected] = useState(
    localStorage.getItem('agrixel_language') || 'english'
  )

  const handleSelect = (code) => {
    setSelected(code)
    i18n.changeLanguage(code)
    localStorage.setItem('agrixel_language', code)
  }

  const handleContinue = async () => {
    localStorage.setItem('agrixel_language', selected)
    i18n.changeLanguage(selected)
    const token = localStorage.getItem('agrixel_token')
    if (token) {
      try {
        await client.patch('/me/language', { language: selected })
      } catch {
        // ignore — UI already updated
      }
    }
    const user = JSON.parse(localStorage.getItem('agrixel_user') || 'null')
    if (token && user) {
      navigate(user.role === 'admin' ? '/admin/overview' : '/farmer/diagnose')
    } else {
      navigate('/login')
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lang-btn:hover {
          border-color: rgba(74,222,128,0.5) !important;
          background: rgba(74,222,128,0.05) !important;
        }
        .continue-btn:hover {
          background: #22c55e !important;
        }
      `}</style>

      {/* Full-screen wrapper */}
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '40px 20px' : '60px 24px',
      }}>
        {/* Content card */}
        <div style={{
          width: '100%',
          maxWidth: '480px',
          animation: 'fadeUp 0.4s ease forwards',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center' }}>
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
              fontSize: '14px',
              color: 'var(--muted)',
              marginTop: '6px',
              fontFamily: 'Inter, sans-serif',
            }}>
              Smart farming, healthy crops
            </div>
          </div>

          {/* Section label */}
          <div style={{
            fontSize: '11px',
            color: 'var(--muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: '40px',
            marginBottom: '12px',
            fontFamily: 'Inter, sans-serif',
          }}>
            Select your language
          </div>

          {/* Language grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}>
            {LANGUAGES.map((lang, index) => {
              const isSelected = selected === lang.code
              const isLast = index === LANGUAGES.length - 1
              return (
                <button
                  key={lang.code}
                  className="lang-btn"
                  onClick={() => handleSelect(lang.code)}
                  style={{
                    height: isMobile ? '52px' : '56px',
                    background: isSelected ? 'var(--primary-dim)' : 'var(--surface)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    width: '100%',
                    gridColumn: isLast ? '1 / -1' : undefined,
                    animation: 'fadeUp 0.3s ease forwards',
                    animationDelay: `${index * 0.04}s`,
                    opacity: 0,
                  }}
                >
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{lang.flag}</span>
                  <span style={{
                    fontSize: isMobile ? '14px' : '15px',
                    fontFamily: 'Inter, sans-serif',
                    color: isSelected ? 'var(--primary)' : 'var(--text)',
                    transition: 'color 0.15s ease',
                  }}>
                    {lang.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Continue button */}
          <button
            className="continue-btn"
            onClick={handleContinue}
            style={{
              width: '100%',
              height: '52px',
              background: 'var(--primary)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
              marginTop: '20px',
              display: selected ? 'block' : 'none',
              animation: 'fadeUp 0.3s ease forwards',
              transition: 'background 0.2s ease',
            }}
          >
            Continue →
          </button>

        </div>
      </div>
    </>
  )
}

export default LanguageSelect

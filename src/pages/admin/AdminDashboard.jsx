import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Activity, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { PageTransition } from '../../components/ui/PageTransition'
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

const NAV_ITEMS = [
  { labelKey: 'overview',        icon: LayoutDashboard, path: '/admin/overview' },
  { labelKey: 'users',           icon: Users,           path: '/admin/users' },
  { labelKey: 'disease_activity', icon: Activity,       path: '/admin/activity' },
]

const PAGE_TITLE_KEYS = {
  '/admin/overview':  'system_overview',
  '/admin/users':     'user_management',
  '/admin/activity':  'disease_activity',
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, updateLanguage } = useAuth()
  const { t } = useTranslation()

  const [logoutHover, setLogoutHover] = useState(false)
  const [navHover, setNavHover] = useState(null)

  const currentLang = user?.preferred_language || localStorage.getItem('agrixel_language') || 'english'
  const pageTitle = t(PAGE_TITLE_KEYS[location.pathname] || 'admin_dashboard')
  const initials = user?.full_name?.charAt(0)?.toUpperCase() || 'A'

  const handleLangChange = (e) => {
    updateLanguage(e.target.value)
  }

  return (
    <>
      <style>{`
        @keyframes navpulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: '220px', minHeight: '100vh',
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          padding: '24px 0', position: 'sticky',
          top: 0, height: '100vh', flexShrink: 0,
        }}>
          {/* Logo */}
          <img
            src={logo}
            alt="Agrixel"
            onClick={() => navigate('/admin/overview')}
            style={{
              width: '140px',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 32px auto',
              cursor: 'pointer',
            }}
          />

          {/* Nav */}
          <nav style={{ flex: 1 }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const isHovered = navHover === item.path
              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setNavHover(item.path)}
                  onMouseLeave={() => setNavHover(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: isActive ? '11px 20px 11px 18px' : '11px 20px',
                    cursor: 'pointer',
                    borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                    background: isActive ? 'var(--primary-dim)' : isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(74,222,128,0.15)' : 'none',
                    color: isActive ? 'var(--primary)' : isHovered ? 'var(--text)' : 'var(--muted)',
                    fontSize: '14px', fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s ease', userSelect: 'none',
                  }}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{t(item.labelKey)}</span>
                  {isActive && (
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--primary)',
                      animation: 'navpulse 2s ease infinite',
                      flexShrink: 0,
                    }} />
                  )}
                </div>
              )
            })}
          </nav>

          {/* Bottom */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{
              padding: '16px 20px', borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '999px',
                background: '#166534', color: 'var(--primary)',
                fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontFamily: 'Syne, sans-serif',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '13px', fontWeight: 500, color: 'var(--text)',
                  fontFamily: 'Inter, sans-serif',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.full_name || 'Admin'}
                </div>
                <div style={{
                  display: 'inline-block', fontSize: '10px', color: '#60a5fa',
                  background: 'rgba(96,165,250,0.1)', padding: '2px 8px',
                  borderRadius: '999px', marginTop: '2px', fontFamily: 'Inter, sans-serif',
                }}>
                  Admin
                </div>
              </div>
            </div>

            <div
              onClick={logout}
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px',
                color: logoutHover ? 'var(--danger)' : 'var(--muted)',
                fontSize: '13px', fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', transition: 'color 0.15s ease', userSelect: 'none',
              }}
            >
              <LogOut size={16} /><span>Logout</span>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
          {/* Top bar */}
          <div style={{
            height: '56px', padding: '0 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)', background: 'var(--bg)',
            position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              {pageTitle}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            <select
              value={currentLang}
              onChange={handleLangChange}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', borderRadius: '6px', padding: '4px 8px',
                fontSize: '12px', fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '28px', flex: 1 }}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard

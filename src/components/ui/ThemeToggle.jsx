import { useTheme } from '../../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: 36,
        height: 36,
        borderRadius: '8px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light'
        ? <Moon size={16} />
        : <Sun size={16} color="#fbbf24" />
      }
    </button>
  )
}

import { useState, useEffect } from 'react'
import { Users, Activity, Cpu } from 'lucide-react'
import client from '../../api/client'

const LANGUAGES = [
  { code: 'english', flag: '🇬🇧', label: 'English' },
  { code: 'hindi',   flag: '🇮🇳', label: 'हिंदी' },
  { code: 'nepali',  flag: '🇳🇵', label: 'नेपाली' },
  { code: 'french',  flag: '🇫🇷', label: 'Français' },
  { code: 'german',  flag: '🇩🇪', label: 'Deutsch' },
  { code: 'korean',  flag: '🇰🇷', label: '한국어' },
  { code: 'chinese', flag: '🇨🇳', label: '中文' },
]

const sectionLabel = (text) => (
  <div style={{
    fontSize: '11px', color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    fontFamily: 'Inter, sans-serif', marginBottom: '16px',
  }}>
    {text}
  </div>
)

const card = (children, style = {}) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px',
    ...style,
  }}>
    {children}
  </div>
)

const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginTop: '16px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
            {item.count}
          </span>
          <div style={{
            width: '100%',
            height: `${Math.max(4, (item.count / max) * 90)}px`,
            background: 'var(--primary)',
            borderRadius: '4px 4px 0 0',
            opacity: i === 0 ? 1 : 0.65,
            transition: 'height 0.5s ease',
          }} />
          <span style={{
            fontSize: 10, color: 'var(--muted)', fontFamily: 'Inter, sans-serif',
            textAlign: 'center', lineHeight: 1.2,
            maxWidth: '100%', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.disease?.split(' ')[0] || `#${i + 1}`}
          </span>
        </div>
      ))}
    </div>
  )
}

const StatusDot = () => (
  <div style={{
    width: '8px', height: '8px', borderRadius: '999px',
    background: 'var(--primary)',
    boxShadow: '0 0 6px rgba(74,222,128,0.5)',
    flexShrink: 0,
  }} />
)

const Overview = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    client.get('/admin/overview')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{
        width: '32px', height: '32px',
        border: '2px solid var(--primary)', borderTopColor: 'transparent',
        borderRadius: '999px', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  )

  const uc   = data?.user_counts  || {}
  const ss   = data?.scan_stats   || {}
  const mode = data?.model_mode   || 'UNKNOWN'
  const isReal = mode?.toUpperCase() === 'REAL' || mode?.toUpperCase().includes('REAL')

  const topDiseases = ss.top_diseases || []
  const maxCount = topDiseases.reduce((m, d) => Math.max(m, d.count || 0), 1)

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
          System Overview
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
          {dateStr} · {timeStr}
        </div>
      </div>

      {/* Row 1 — Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Users',   value: uc.total   ?? '—', Icon: Users,    iconColor: 'var(--primary)' },
          { label: 'Total Farmers', value: uc.farmer  ?? '—', icon: '👨‍🌾',   iconColor: null },
          { label: 'Total Scans',   value: ss.total_scans ?? '—', Icon: Activity, iconColor: 'var(--primary)' },
          {
            label: 'Model Mode',
            value: mode?.toUpperCase() || '—',
            Icon: Cpu,
            iconColor: isReal ? 'var(--primary)' : 'var(--warning)',
            valueColor: isReal ? 'var(--primary)' : 'var(--warning)',
          },
        ].map(({ label, value, Icon, icon, iconColor, valueColor }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '20px 24px',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', color: iconColor || 'var(--muted)' }}>
              {Icon ? <Icon size={20} /> : <span style={{ fontSize: '20px' }}>{icon}</span>}
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: '32px',
              fontWeight: 700, color: valueColor || 'var(--text)', lineHeight: 1,
            }}>
              {value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Row 2 — Two columns */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Top diseases */}
          {card(<>
            {sectionLabel('Most Diagnosed Diseases')}
            {topDiseases.length > 0 ? (
              <>
                {topDiseases.slice(0, 5).map((d, i) => (
                  <div key={i} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                        {d.disease || d.label || d.name || `Disease ${i + 1}`}
                      </span>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', color: 'var(--primary)' }}>
                        {d.count ?? 0}
                      </span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round(((d.count || 0) / maxCount) * 100)}%`,
                        background: 'var(--primary)', borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                ))}
                <BarChart data={topDiseases.slice(0, 5).map(d => ({ disease: d.disease || d.label || d.name || 'Unknown', count: d.count || 0 }))} />
              </>
            ) : (
              <div style={{ color: 'var(--muted-2)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                No disease data yet.
              </div>
            )}
          </>)}

          {/* AI Usage */}
          {card(<>
            {sectionLabel('AI Usage')}
            <div style={{ display: 'flex', gap: '24px' }}>
              {[
                { label: 'Claude Calls',    value: ss.claude_calls   ?? '—' },
                { label: 'Cache Hits',      value: ss.cache_hits     ?? '—' },
                { label: 'Vision Reviews',  value: ss.vision_calls   ?? ss.vision_reviews ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>

        {/* Right column */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* System status */}
          {card(<>
            {sectionLabel('System Status')}
            {[
              { label: 'API Server', value: 'Online',     dot: true },
              { label: 'Model',      value: mode || '—',  dot: true },
              { label: 'Database',   value: 'Healthy',    dot: true },
              { label: 'Version',    value: 'v1.0.0',     dot: false },
            ].map(({ label, value, dot }, i, arr) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {dot && <StatusDot />}
                  <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </>)}

          {/* Supported Languages */}
          {card(<>
            {sectionLabel('Supported Languages')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {LANGUAGES.map(l => (
                <div key={l.code} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{l.flag}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>
    </div>
  )
}

export default Overview

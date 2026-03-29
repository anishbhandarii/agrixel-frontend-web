import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, CheckCircle2, Target, AlertTriangle, Microscope } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import client from '../../api/client'
import PlantImage from '../../components/ui/PlantImage'
import { getDisplayNames, getHealthScore, getScoreColor } from '../../utils/healthScore'

const TIPS = [
  '💧 Water at the base — wet leaves promote fungal disease',
  '🌅 Inspect crops in early morning for best visibility',
  '🔄 Rotate crops each season to prevent soil-borne diseases',
  '🔥 Remove and burn infected leaves — never compost them',
  '🌿 Neem oil every 7 days prevents most fungal infections',
  '💨 Good air circulation reduces disease spread significantly',
  '📷 Natural daylight gives the most accurate AI diagnosis',
  '📅 Scan weekly during growing season for early detection',
]

const normalizeConfidence = (v) => {
  if (typeof v === 'number') return v <= 1 ? v * 100 : v
  if (typeof v === 'string') { const n = Number(v); if (!Number.isNaN(n)) return n <= 1 ? n * 100 : n }
  return null
}

const normalizeHistoryScan = (scan) => {
  const nested = scan?.full_response || {}
  const conf = normalizeConfidence(scan?.confidence ?? nested?.confidence)
  return {
    ...nested,
    ...scan,
    confidence: conf,
    is_healthy: scan?.is_healthy === true || scan?.is_healthy === 1 || scan?.is_healthy === '1',
    urgency: scan?.urgency ?? nested?.urgency ?? 'none',
  }
}

const formatRelative = (ts) => {
  if (!ts) return ''
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const urgencyBorder = (urgency) => {
  if (urgency === 'high')   return 'var(--danger)'
  if (urgency === 'medium') return 'var(--warning)'
  return 'var(--success)'
}

// ── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, sub, valueColor, danger, borderColor, icon: Icon, iconColor }) => (
  <div style={{
    background: 'var(--surface)',
    border: `1px solid ${danger ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
    borderLeft: `3px solid ${borderColor || 'var(--border)'}`,
    borderRadius: '12px',
    padding: '20px',
    flex: 1,
    minWidth: 0,
    position: 'relative',
  }}>
    {Icon && (
      <div style={{ position: 'absolute', top: 14, right: 14, opacity: 0.4 }}>
        <Icon size={17} color={iconColor || 'var(--primary)'} />
      </div>
    )}
    <div style={{
      fontFamily: 'Syne, sans-serif',
      fontSize: '30px',
      fontWeight: 700,
      color: valueColor || 'var(--text)',
      lineHeight: 1,
    }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </div>
    {sub && (
      <div style={{ fontSize: '11px', color: 'var(--muted-2)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
        {sub}
      </div>
    )}
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stats, setStats]     = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [time, setTime]       = useState('')
  const [tipIdx, setTipIdx]   = useState(0)
  const [tipVisible, setTipVisible] = useState(true)
  const tipTimer = useRef(null)

  // Data fetch
  useEffect(() => {
    Promise.all([
      client.get('/me/stats'),
      client.get('/history'),
    ]).then(([statsRes, historyRes]) => {
      setStats(statsRes.data)
      const raw = Array.isArray(historyRes.data?.scans)
        ? historyRes.data.scans
        : (Array.isArray(historyRes.data) ? historyRes.data : [])
      setHistory(raw.map(normalizeHistoryScan))
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Clock — update every minute
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [])

  // Rotating tips — fade out, change, fade in
  useEffect(() => {
    tipTimer.current = setInterval(() => {
      setTipVisible(false)
      setTimeout(() => {
        setTipIdx(i => (i + 1) % TIPS.length)
        setTipVisible(true)
      }, 500)
    }, 5000)
    return () => clearInterval(tipTimer.current)
  }, [])

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.full_name?.split(' ')[0] || 'Farmer'

  // Derived stats
  const total       = stats?.total_scans ?? 0
  const healthy     = stats?.healthy_count ?? 0
  const healthPct   = total > 0 ? Math.round((healthy / total) * 100) : 0
  const avgConf     = stats?.avg_confidence ?? 0
  const highRisk    = stats?.high_urgency_count ?? 0
  const thisWeek    = stats?.scans_this_week ?? 0
  const topDiseases = stats?.top_diseases ?? []
  const maxCount    = topDiseases.reduce((m, d) => Math.max(m, d.count || 0), 1)
  const avgRating   = stats?.avg_rating ?? null
  const ratedCount  = stats?.rated_scans_count ?? 0

  const confSub = avgConf >= 85
    ? 'Excellent accuracy 🎯'
    : avgConf >= 70 ? 'Good accuracy'
    : 'Try better lighting'

  const recentScans   = history.slice(0, 5)
  const highRiskScans = history.filter(s => s.urgency === 'high').slice(0, 3)

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

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
            {greeting}, {firstName} 👋
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
            Here&apos;s your farm health overview
          </div>
        </div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', color: 'var(--muted)', paddingTop: '4px' }}>
          {time}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <StatCard
          value={total}
          label="Total Scans"
          sub={thisWeek > 0 ? `+${thisWeek} this week` : 'No scans this week'}
          valueColor={thisWeek > 0 ? 'var(--primary)' : 'var(--text)'}
          borderColor="var(--primary)"
          icon={Activity}
          iconColor="var(--primary)"
        />
        <StatCard
          value={healthy}
          label="Healthy Plants"
          sub={healthy === 0 ? 'Keep scanning to track' : `${healthPct}% of your scans`}
          valueColor={healthy === 0 ? 'var(--muted)' : undefined}
          borderColor="#16a34a"
          icon={CheckCircle2}
          iconColor="#16a34a"
        />
        <StatCard
          value={`${avgConf}%`}
          label="Avg Confidence"
          sub={confSub}
          borderColor="var(--primary)"
          icon={Target}
          iconColor="var(--primary)"
        />
        <StatCard
          value={highRisk}
          label="High Risk Alerts"
          sub={highRisk > 0 ? 'Need immediate attention' : 'All clear ✓'}
          valueColor={highRisk > 0 ? 'var(--danger)' : 'var(--success)'}
          borderColor={highRisk > 0 ? 'var(--danger)' : 'var(--border)'}
          danger={highRisk > 0}
          icon={AlertTriangle}
          iconColor={highRisk > 0 ? 'var(--danger)' : 'var(--muted)'}
        />
        {avgRating !== null && ratedCount > 0 && (
          <StatCard
            value={`⭐ ${avgRating}`}
            label="Avg Rating"
            sub={`from ${ratedCount} rating${ratedCount === 1 ? '' : 's'}`}
            valueColor="#fbbf24"
            borderColor="#fbbf24"
          />
        )}
      </div>

      {/* ── Two column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* LEFT — Recent Scans */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              Recent Scans
            </div>
            {recentScans.length > 0 && (
              <button
                onClick={() => navigate('/farmer/history')}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--primary)', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
              >
                View all →
              </button>
            )}
          </div>

          {recentScans.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '32px 0' }}>
              <div style={{ fontSize: '14px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>No scans yet</div>
              <button
                onClick={() => navigate('/farmer/diagnose')}
                style={{
                  padding: '8px 20px',
                  background: 'var(--primary)', color: 'var(--bg)',
                  border: 'none', borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📷 Scan your first plant →
              </button>
            </div>
          ) : (
            <div>
              {recentScans.map((scan, i) => {
                const score = getHealthScore(scan)
                const displayScore = (!score || score === 0) ? 5 : score
                const scoreColor = getScoreColor(displayScore)
                const { crop: displayCrop, disease: displayDisease, isCorrected: isVisionCorrected } = getDisplayNames(scan)
                return (
                  <div
                    key={scan.scan_id || i}
                    onClick={() => navigate('/farmer/result', { state: scan })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 0',
                      borderBottom: i < recentScans.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      borderLeft: `3px solid ${urgencyBorder(scan.urgency)}`,
                      paddingLeft: '10px',
                      marginLeft: '-10px',
                    }}
                  >
                    <PlantImage filename={scan.image_filename} width={44} height={44} borderRadius="8px" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                          {displayCrop || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                          · {displayDisease || (scan.is_healthy ? 'Healthy' : 'Unknown')}
                        </span>
                        {isVisionCorrected && (
                          <span style={{
                            fontSize: 9,
                            background: 'rgba(59,130,246,0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59,130,246,0.2)',
                            borderRadius: 999,
                            padding: '1px 6px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            verticalAlign: 'middle',
                          }}>
                            AI Corrected
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: '5px' }}>
                        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${displayScore}%`,
                            background: scoreColor, borderRadius: '999px',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted-2)', fontFamily: 'Inter, sans-serif' }}>
                          {formatRelative(scan.timestamp)}
                        </span>
                        {scan.confidence != null && (
                          <span style={{ fontSize: 10, color: 'var(--muted-2)', fontFamily: 'Inter, sans-serif' }}>
                            · {Math.round(scan.confidence)}% conf
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                          {displayScore ?? '—'}
                        </span>
                        {displayScore != null && (
                          <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>/100</span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>score</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Quick Diagnosis */}
          <div style={{
            background: 'var(--primary-dim)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(74,222,128,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Microscope size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 600, color: 'var(--primary)' }}>
                  Quick Diagnosis
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                  Get instant AI analysis
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/farmer/diagnose')}
              style={{
                width: '100%', height: '40px',
                background: 'var(--primary)', color: '#0a0f0a',
                border: 'none', borderRadius: '8px',
                fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Scan a Plant →
            </button>
          </div>

          {/* Top issues */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            flex: 1,
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'Inter, sans-serif', fontWeight: 500, marginBottom: '14px' }}>
              Your Top Issues
            </div>
            {topDiseases.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--success)', fontFamily: 'Inter, sans-serif' }}>
                No diseases detected yet 🎉
              </div>
            ) : topDiseases.slice(0, 5).map((d, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                    {d.disease || `Disease ${i + 1}`}
                  </span>
                  <span style={{
                    background: 'var(--primary-dim)', color: 'var(--primary)',
                    borderRadius: '999px', padding: '1px 7px',
                    fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  }}>
                    {d.count}
                  </span>
                </div>
                <div style={{ height: '3px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round((d.count / maxCount) * 100)}%`,
                    background: 'var(--primary)', borderRadius: '999px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── High Risk Alerts ── */}
      {highRisk > 0 && highRiskScans.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--danger)', marginBottom: '10px' }}>
            ⚠️ Requires Attention
          </div>
          {highRiskScans.map((scan, i) => {
            const { crop: alertCrop, disease: alertDisease, isCorrected: alertCorrected } = getDisplayNames(scan)
            return (
              <div
                key={scan.scan_id || i}
                onClick={() => navigate('/farmer/result', { state: scan })}
                style={{
                  background: 'var(--danger-dim)',
                  border: '1px solid rgba(248,113,113,0.15)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  cursor: 'pointer', marginBottom: '8px',
                }}
              >
                <PlantImage filename={scan.image_filename} width={44} height={44} borderRadius="8px" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    {alertCrop || 'Unknown'} · {alertDisease || 'Unknown condition'}
                    {alertCorrected && (
                      <span style={{
                        fontSize: 9, background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                        border: '1px solid rgba(59,130,246,0.2)', borderRadius: 999,
                        padding: '1px 6px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
                      }}>
                        AI Corrected
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                    High urgency
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                    {formatRelative(scan.timestamp)}
                  </div>
                </div>
                <span style={{ color: 'var(--danger)', fontSize: '16px' }}>→</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Rotating Tip ── */}
      <div style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
        <div style={{
          fontSize: '12px',
          color: 'var(--muted)',
          fontFamily: 'Inter, sans-serif',
          fontStyle: 'italic',
          opacity: tipVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          {TIPS[tipIdx]}
        </div>
      </div>
    </div>
  )
}

export default Home

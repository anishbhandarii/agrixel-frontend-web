import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import client from '../../api/client'
import PlantImage from '../../components/ui/PlantImage'
import { getDisplayNames, getHealthScore, getScoreColor } from '../../utils/healthScore'

const LANG_SHORT = {
  english: '🇬🇧 EN', hindi: '🇮🇳 HI', nepali: '🇳🇵 NE',
  french: '🇫🇷 FR', german: '🇩🇪 DE', korean: '🇰🇷 KO', chinese: '🇨🇳 ZH',
}

const URGENCY = {
  high:   { label: 'High Risk', color: 'var(--danger)', bg: 'rgba(248,113,113,0.12)' },
  medium: { label: 'Medium',    color: 'var(--warning)', bg: 'rgba(251,191,36,0.12)' },
  low:    { label: 'Low Risk',  color: 'var(--primary)', bg: 'rgba(74,222,128,0.12)' },
}

const pickFirst = (...values) => values.find(value => value !== undefined && value !== null)

const normalizeConfidence = (value) => {
  if (typeof value === 'number') return value <= 1 ? value * 100 : value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed <= 1 ? parsed * 100 : parsed
  }
  return null
}

const toBoolean = (value) => value === true || value === 1 || value === '1'

const normalizeHistoryScan = (scan, index) => {
  const nested = scan?.result || scan?.diagnosis || scan?.scan || {}
  const confidence = normalizeConfidence(
    pickFirst(
      scan?.confidence,
      scan?.confidence_score,
      scan?.confidenceScore,
      nested?.confidence,
      nested?.confidence_score,
      nested?.confidenceScore,
    ),
  )
  const isHealthy = toBoolean(
    pickFirst(scan?.is_healthy, scan?.isHealthy, nested?.is_healthy, nested?.isHealthy),
  )
  const rawHealthScore = pickFirst(
    scan?.health_score,
    scan?.healthScore,
    nested?.health_score,
    nested?.healthScore,
  )
  const fallbackHealthScore = confidence == null
    ? null
    : (isHealthy ? Math.round(confidence) : Math.round(100 - confidence))
  const healthScore = rawHealthScore == null || rawHealthScore === 0
    ? fallbackHealthScore
    : rawHealthScore

  return {
    ...nested,
    ...scan,
    scan_id: pickFirst(scan?.scan_id, scan?.id, nested?.scan_id, nested?.id, index),
    timestamp: pickFirst(scan?.timestamp, scan?.created_at, nested?.timestamp, nested?.created_at),
    crop: pickFirst(scan?.crop, nested?.crop),
    disease: pickFirst(scan?.disease, nested?.disease),
    confidence,
    health_score: healthScore,
    is_healthy: isHealthy,
    urgency: pickFirst(scan?.urgency, nested?.urgency, 'none'),
    language: pickFirst(scan?.language, nested?.language),
    mode: pickFirst(scan?.mode, nested?.mode),
    image_filename: pickFirst(
      scan?.image_filename,
      scan?.imageFilename,
      nested?.image_filename,
      nested?.imageFilename,
    ),
    result_type: pickFirst(scan?.result_type, scan?.resultType, nested?.result_type, nested?.resultType),
  }
}

const formatDate = (ts) => {
  if (!ts) return '—'
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (diffDays === 0) return `Today · ${time}`
  if (diffDays === 1) return `Yesterday · ${time}`
  if (diffDays < 7)  return `${diffDays} days ago · ${time}`
  if (diffDays < 14) return `Last week · ${time}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ` · ${time}`
}


const History = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isMobile, width } = useBreakpoint()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hovered, setHovered] = useState(null)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    let isMounted = true

    client.get('/history')
      .then((response) => {
        const rawScans = Array.isArray(response.data?.scans)
          ? response.data.scans
          : (Array.isArray(response.data) ? response.data : [])

        if (isMounted) {
          const normalized = rawScans.map(normalizeHistoryScan)
          setScans(normalized)
        }
      })
      .catch(() => {
        if (isMounted) setError('Failed to load history.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(''), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const handleOpenScan = (scan) => {
    navigate('/farmer/result', { state: scan })
  }

  const handleDeleteScan = async (event, scanId) => {
    event.stopPropagation()

    if (scanId == null) {
      setError('This scan cannot be deleted yet.')
      return
    }

    const confirmed = window.confirm('Delete this scan? This cannot be undone.')
    if (!confirmed) return

    try {
      await client.delete(`/history/${scanId}`)
      setScans(current => current.filter(scan => scan.scan_id !== scanId))
      setToast('Scan removed')
    } catch (err) {
      if (err?.response?.status === 404) {
        setScans(current => current.filter(scan => scan.scan_id !== scanId))
        setToast('Scan removed')
        return
      }
      setError('Failed to delete scan.')
    }
  }

  const total = scans.length
  const healthy = scans.filter(scan => scan.is_healthy).length
  const sick = total - healthy

  const filteredScans = scans
    .filter(scan => {
      if (filter === 'healthy')   return scan.is_healthy
      if (filter === 'diseased')  return !scan.is_healthy
      if (filter === 'high_risk') return scan.urgency === 'high'
      return true
    })
    .sort((a, b) => {
      if (sort === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp)
      if (sort === 'worst_health') {
        const sa = a.health_score ?? 100
        const sb = b.health_score ?? 100
        return sa - sb
      }
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

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
    <>
      <style>{`
        @keyframes toast-fade {
          0% { opacity: 0; transform: translateY(8px); }
          12% { opacity: 1; transform: translateY(0); }
          84% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(8px); }
        }
        .history-delete-btn:hover {
          border-color: var(--danger) !important;
          color: var(--danger) !important;
        }
      `}</style>

      <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
          {t('scan_history')}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
          {t('your_past_diagnoses')}
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: '8px', padding: '12px 16px', color: 'var(--danger)',
          fontSize: '13px', fontFamily: 'Inter, sans-serif', marginBottom: '16px',
        }}>{error}</div>
      )}

      {/* Empty state */}
      {!loading && !error && scans.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 0', gap: '12px',
        }}>
          <Camera size={64} color="var(--muted-2)" />
          <div style={{ fontSize: '16px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>{t('no_scans_yet')}</div>
          <div style={{ fontSize: '13px', color: 'var(--muted-2)', fontFamily: 'Inter, sans-serif' }}>
            Upload a plant photo to get started
          </div>
          <button
            onClick={() => navigate('/farmer/diagnose')}
            style={{
              marginTop: '8px', padding: '10px 24px',
              background: 'var(--primary)', color: 'var(--bg)',
              border: 'none', borderRadius: '8px',
              fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Diagnose a Plant
          </button>
        </div>
      )}

      {scans.length > 0 && (
        <>
          {/* Summary bar */}
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginBottom: '16px' }}>
            {total} total scan{total !== 1 ? 's' : ''} · {' '}
            <span style={{ color: 'var(--primary)' }}>{healthy} healthy</span> · {' '}
            <span style={{ color: 'var(--danger)' }}>{sick} diseased</span>
          </div>

          {/* Filter bar + sort */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '4px' : '0', flexShrink: 0 }}>
              {[
                { key: 'all',       label: 'All' },
                { key: 'healthy',   label: 'Healthy' },
                { key: 'diseased',  label: 'Diseased' },
                { key: 'high_risk', label: 'High Risk' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    border: filter === key ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: filter === key ? 'rgba(74,222,128,0.12)' : 'transparent',
                    color: filter === key ? 'var(--primary)' : 'var(--muted)',
                    fontSize: '12px', fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '6px', padding: '0 10px',
                height: '32px',
                color: 'var(--muted)', fontSize: '12px',
                fontFamily: 'Inter, sans-serif', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="worst_health">Worst health</option>
            </select>
          </div>

          {/* Scan list */}
          {filteredScans.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: '24px 0', textAlign: 'center' }}>
              No scans match this filter.
            </div>
          )}
          {filteredScans.map((scan, i) => {
            const { crop: displayCrop, disease: displayDisease, isCorrected: isVisionCorrected } = getDisplayNames(scan)
            const u = URGENCY[scan.urgency]
            const score = getHealthScore(scan)
            const displayScore = (!score || score === 0) ? 5 : score
            const scoreColor = getScoreColor(displayScore)
            const urgencyBorderColor = scan.urgency === 'high'
              ? 'var(--danger)'
              : scan.urgency === 'medium'
              ? 'var(--warning)'
              : 'var(--success)'
            return (
              <div
                key={scan.scan_id || i}
                onClick={() => handleOpenScan(scan)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative',
                  background: hovered === i ? 'rgba(255,255,255,0.015)' : 'var(--surface)',
                  border: `1px solid ${hovered === i ? '#2d4a2d' : 'var(--border)'}`,
                  borderLeft: `3px solid ${urgencyBorderColor}`,
                  borderRadius: '12px',
                  marginBottom: '12px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  padding: isMobile ? '12px' : '16px',
                  paddingRight: '56px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <button
                  type="button"
                  className="history-delete-btn"
                  onClick={(event) => handleDeleteScan(event, scan.scan_id)}
                  aria-label="Delete scan"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '999px',
                    background: 'transparent',
                    border: '1px solid var(--muted-2)',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <X size={14} />
                </button>

                {/* Thumbnail */}
                <PlantImage filename={scan.image_filename} width={isMobile ? 52 : 64} height={isMobile ? 52 : 64} borderRadius="8px" />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'Syne, sans-serif', fontSize: '15px',
                      fontWeight: 700, color: 'var(--text)',
                    }}>
                      {displayCrop || 'Unknown Crop'}
                    </span>
                    <span style={{ color: 'var(--muted-2)', fontSize: '14px' }}>·</span>
                    <span style={{ fontSize: '14px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                      {displayDisease || (scan.is_healthy ? 'Healthy' : 'Unknown')}
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
                  <div style={{
                    fontSize: '12px', color: 'var(--muted-2)',
                    fontFamily: 'Inter, sans-serif', marginTop: '4px',
                  }}>
                    {formatDate(scan.timestamp)}
                  </div>
                  {/* Health score bar */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ height: '3px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${displayScore}%`,
                        background: scoreColor,
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginTop: '3px' }}>
                      Health Score · {displayScore}/100
                    </div>
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {scan.language && (
                      <span style={{
                        background: 'var(--border)', color: 'var(--muted)',
                        borderRadius: '999px', padding: '2px 6px',
                        fontSize: '10px', fontFamily: 'Inter, sans-serif',
                      }}>
                        {LANG_SHORT[scan.language] || scan.language}
                      </span>
                    )}
                    {scan.confidence != null && width >= 380 && (
                      <span style={{ fontSize: 10, color: 'var(--muted-2)', fontFamily: 'Inter, sans-serif' }}>
                        {Math.round(scan.confidence)}% conf
                      </span>
                    )}
                  </div>
                </div>

                {/* Score + urgency */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px' }}>
                    <span style={{
                      fontFamily: 'Syne, sans-serif', fontSize: isMobile ? '22px' : '24px',
                      fontWeight: 700, color: scoreColor, lineHeight: 1,
                    }}>
                      {displayScore ?? '—'}
                    </span>
                    {displayScore != null && (
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>/ 100</span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                    score
                  </div>
                  {u && (
                    <div style={{
                      marginTop: '6px',
                      background: u.bg, color: u.color,
                      borderRadius: '999px', padding: '3px 8px',
                      fontSize: '10px', fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      {u.label}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: 'var(--text)',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          animation: 'toast-fade 2.5s ease forwards',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}

export default History

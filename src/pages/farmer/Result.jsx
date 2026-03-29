import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import PlantImage from '../../components/ui/PlantImage'
import StarRating from '../../components/ui/StarRating'
import client from '../../api/client'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { getHealthScore, getScoreColor } from '../../utils/healthScore'

const URGENCY_COLOR = {
  high:   'var(--danger)',
  medium: 'var(--warning)',
  low:    'var(--primary)',
  none:   'var(--primary)',
}

const RESULT_TYPE_LABEL = {
  model_plus_llm:              { label: 'Fast Analysis',       color: 'var(--primary)',  bg: 'rgba(74,222,128,0.1)' },
  model_plus_llm_caution:      { label: 'Moderate Confidence', color: 'var(--warning)',  bg: 'rgba(251,191,36,0.1)' },
  model_plus_vision_review:    { label: 'Vision Verified',     color: '#60a5fa',  bg: 'rgba(96,165,250,0.1)' },
  history:                     { label: 'Saved Scan',          color: 'var(--muted)',  bg: 'rgba(107,114,128,0.1)' },
}

const normalizeConfidence = (value) => {
  if (typeof value === 'number') return value <= 1 ? value * 100 : value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed <= 1 ? parsed * 100 : parsed
  }
  return null
}

const toBoolean = (value) => value === true || value === 1 || value === '1'

const cleanText = (text) => text
  ?.replace(/â€"/g, '—')
  ?.replace(/â€™/g, "'")
  ?.replace(/â€œ/g, '"')
  ?.replace(/â€/g, '"') || ''

const Pill = ({ children, color, bg }) => (
  <span style={{
    display: 'inline-block',
    background: bg,
    color,
    borderRadius: '999px',
    padding: '3px 10px',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
  }}>
    {children}
  </span>
)

const Result = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile } = useBreakpoint()
  const result = location.state?.result || location.state

  console.log('Result data:', location.state)
  console.log('Health score:', location.state?.health_score)

  const isVisionCorrected = result?.result_type === 'model_plus_vision_review'
    && result?.verified === false

  const KNOWN_CROPS = [
    'Apple', 'Grape', 'Tomato', 'Potato', 'Corn', 'Rice',
    'Strawberry', 'Peach', 'Cherry', 'Orange', 'Pepper',
    'Blueberry', 'Raspberry', 'Soybean', 'Squash', 'Grapevine',
  ]

  const parseConfirmedDiagnosis = (confirmed, originalCrop) => {
    if (!confirmed) return { crop: originalCrop, disease: 'Unknown' }
    // "Disease on Crop"
    if (confirmed.includes(' on ')) {
      const parts = confirmed.split(' on ')
      return { crop: parts[1].trim(), disease: parts[0].trim() }
    }
    // "Grape Downy Mildew" or "Apple Scab (Venturia inaequalis)"
    const firstWord = confirmed.split(' ')[0]
    if (KNOWN_CROPS.includes(firstWord)) {
      return {
        crop: firstWord,
        disease: confirmed.replace(firstWord, '').replace(/\(.*\)/, '').trim(),
      }
    }
    // Fallback — full string is the disease, keep original crop
    return { crop: originalCrop, disease: confirmed.replace(/\(.*\)/, '').trim() }
  }

  const displayCrop = isVisionCorrected
    ? (result?.confirmed_crop || parseConfirmedDiagnosis(result?.confirmed_diagnosis, result?.crop).crop)
    : result?.crop

  const displayDisease = isVisionCorrected
    ? (result?.confirmed_disease || parseConfirmedDiagnosis(result?.confirmed_diagnosis, result?.crop).disease)
    : result?.disease

  const [activeTab, setActiveTab] = useState('organic')
  const [top3Open, setTop3Open] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)
  const [expandedCats, setExpandedCats] = useState({})
  const [copiedItem, setCopiedItem] = useState(null)
  const [rating, setRating] = useState(result?.rating || 0)
  const [comment, setComment] = useState('')
  const [ratingSubmitted, setRatingSubmitted] = useState(!!result?.rating)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [ratingError, setRatingError] = useState('')

  // Redirect if no result data
  if (!result) {
    navigate('/farmer/diagnose', { replace: true })
    return null
  }

  const isHistoryResult = !Array.isArray(result?.treatment_steps)
  const normalizedConfidence = normalizeConfidence(result?.confidence)
  const normalizedIsHealthy = toBoolean(result?.is_healthy)
  const data = {
    ...result,
    treatment_steps: Array.isArray(result?.treatment_steps) ? result.treatment_steps : [],
    prevention: Array.isArray(result?.prevention) ? result.prevention : [],
    top_3: Array.isArray(result?.top_3) ? result.top_3 : [],
    inorganic: result?.inorganic || {},
    explanation: result?.explanation || `${result?.disease || 'A condition'} detected on your ${result?.crop || 'plant'}.`,
    severity_message: result?.severity_message || '',
    when_to_escalate: result?.when_to_escalate || 'Consult a local agronomist if the condition worsens.',
    local_materials: result?.local_materials || '',
    caution: result?.caution || null,
    confidence: normalizedConfidence,
    is_healthy: normalizedIsHealthy,
    health_score: result?.health_score ?? result?.full_response?.health_score ?? null,
    result_type: result?.result_type || (isHistoryResult ? 'history' : 'Diagnosis'),
    urgency: result?.urgency || (normalizedIsHealthy ? 'none' : 'low'),
  }

  const {
    crop, disease, confidence, is_healthy,
    status, result_type, urgency, caution,
    explanation, severity_message,
    treatment_steps, local_materials, prevention,
    inorganic, top_3, when_to_escalate,
    image_filename,
  } = data

  const score = getHealthScore(data)
  const displayScore = score === 0 ? 5 : score
  const scoreColor = getScoreColor(displayScore)

  const urgencyColor = URGENCY_COLOR[urgency] || 'var(--primary)'
  const resultTypeMeta = RESULT_TYPE_LABEL[result_type] || { label: result_type || 'Diagnosis', color: 'var(--muted)', bg: 'rgba(107,114,128,0.1)' }

  const hasPesticides   = inorganic?.pesticides?.length > 0
  const hasFungicides   = inorganic?.fungicides?.length > 0
  const hasInsecticides = inorganic?.insecticides?.length > 0
  const hasChemicals    = hasPesticides || hasFungicides || hasInsecticides

  const tabStyle = (tab) => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
    transition: 'all 0.15s ease',
    fontWeight: activeTab === tab ? 500 : 400,
  })

  const sectionTitle = (text) => (
    <div style={{
      fontSize: '11px',
      color: 'var(--muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      fontFamily: 'Inter, sans-serif',
      marginBottom: '12px',
    }}>
      {text}
    </div>
  )

  const card = (children, extra = {}) => (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      ...extra,
    }}>
      {children}
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .action-btn:hover { opacity: 0.85 !important; }
        .conf-bar-fill { transition: width 0.4s ease; }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {isHistoryResult && (
          <div style={{
            background: 'rgba(74,222,128,0.05)',
            border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: 'var(--muted)',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <Info size={14} color="var(--muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>For full treatment details, diagnose this plant again with a fresh photo.</span>
          </div>
        )}

        {/* Back */}
        <div
          onClick={() => navigate(isHistoryResult ? '/farmer/history' : '/farmer/diagnose')}
          style={{
            fontSize: '13px',
            color: 'var(--muted)',
            cursor: 'pointer',
            marginBottom: '24px',
            fontFamily: 'Inter, sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isHistoryResult ? '← Back to History' : '← Back to Diagnose'}
        </div>

        {/* ── Result Header Card ── */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Colored status bar */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '3px',
            background: urgencyColor,
          }} />
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Image + score row on mobile */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <PlantImage filename={image_filename} width={isMobile ? 80 : 100} height={isMobile ? 80 : 100} borderRadius="10px" />
              {/* Health score ring — inline on mobile */}
              {isMobile && (() => {
                const r = 30
                const cx = 36
                const cy = 36
                const circ = 2 * Math.PI * r
                const pct = displayScore != null ? displayScore / 100 : 0
                return (
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
                    <circle
                      cx={cx} cy={cy} r={r} fill="none"
                      stroke={scoreColor} strokeWidth="4"
                      strokeDasharray={circ}
                      strokeDashoffset={circ * (1 - pct)}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${cx} ${cy})`}
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                    <text x={cx} y={cy - 3} textAnchor="middle" fill={scoreColor}
                      style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700 }}>
                      {displayScore ?? '—'}
                    </text>
                    <text x={cx} y={cy + 11} textAnchor="middle" fill="var(--muted)"
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px' }}>
                      score
                    </text>
                  </svg>
                )
              })()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: isMobile ? '0' : '96px' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? '20px' : '22px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                {displayCrop || 'Unknown Crop'}
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                {displayDisease || (is_healthy ? 'No disease detected' : 'Unknown condition')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {isVisionCorrected ? (
                  <>
                    <Pill color="var(--warning)" bg="rgba(251,191,36,0.1)">
                      {confidence != null ? `${confidence.toFixed(1)}% initial` : 'N/A'}
                    </Pill>
                    <Pill color="#3b82f6" bg="rgba(59,130,246,0.1)">
                      Vision Verified ✓
                    </Pill>
                  </>
                ) : (
                  <>
                    <Pill color="var(--primary)" bg="rgba(74,222,128,0.1)">
                      {confidence != null ? `${confidence.toFixed(1)}% confidence` : 'N/A'}
                    </Pill>
                    <Pill color={resultTypeMeta.color} bg={resultTypeMeta.bg}>
                      {resultTypeMeta.label}
                    </Pill>
                  </>
                )}
                {is_healthy
                  ? <Pill color="var(--primary)" bg="rgba(74,222,128,0.1)">Healthy ✓</Pill>
                  : urgency !== 'none' && (
                      <Pill color={urgencyColor} bg={`${urgencyColor}18`}>
                        {urgency?.charAt(0).toUpperCase() + urgency?.slice(1)} Urgency
                      </Pill>
                    )
                }
              </div>
            </div>

            {/* Health score ring — absolute on desktop */}
            {!isMobile && (
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                {(() => {
                  const r = 34
                  const cx = 40
                  const cy = 40
                  const circ = 2 * Math.PI * r
                  const pct = displayScore != null ? displayScore / 100 : 0
                  return (
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
                      <circle
                        cx={cx} cy={cy} r={r} fill="none"
                        stroke={scoreColor} strokeWidth="4"
                        strokeDasharray={circ}
                        strokeDashoffset={circ * (1 - pct)}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                      <text x={cx} y={cy - 4} textAnchor="middle" fill={scoreColor}
                        style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700 }}>
                        {displayScore ?? '—'}
                      </text>
                      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--muted)"
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px' }}>
                        score
                      </text>
                    </svg>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

        {/* ── Vision Correction Banner ── */}
        {isVisionCorrected && (
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>🔍</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>
                  AI Vision Correction
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, marginBottom: result?.vision_note ? '8px' : 0 }}>
                  Our visual AI reviewed this image and corrected the initial diagnosis
                  from <strong style={{ color: 'var(--text)' }}>'{result?.original_diagnosis}'</strong> to{' '}
                  <strong style={{ color: 'var(--text)' }}>'{result?.confirmed_diagnosis}'</strong>
                </div>
                {result?.vision_note && (
                  <div style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {result.vision_note}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Caution Banner ── */}
        {caution && (
          <div style={{
            background: 'var(--warning-dim)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: 'var(--warning)',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}>
            <span>⚠️</span>
            <span>{caution}</span>
          </div>
        )}

        {/* ── Explanation ── */}
        {card(<>
          {sectionTitle("What's happening?")}
          <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            {explanation || 'No explanation available.'}
          </p>
          {severity_message && (
            <p style={{ fontSize: '13px', color: 'var(--warning)', marginTop: '10px', fontFamily: 'Inter, sans-serif' }}>
              {severity_message}
            </p>
          )}
        </>)}

        {/* ── Treatment Tabs ── */}
        {card(<>
          {sectionTitle('Treatment')}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
            <button style={tabStyle('organic')} onClick={() => setActiveTab('organic')}>🌿 Organic</button>
            <button style={tabStyle('chemical')} onClick={() => setActiveTab('chemical')}>⚗️ Chemical</button>
          </div>

          {/* Organic */}
          {activeTab === 'organic' && (
            <div>
              {/* Steps */}
              {treatment_steps?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  {treatment_steps.map((step, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'flex-start',
                      background: 'var(--surface-2, rgba(255,255,255,0.03))',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                    }}>
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '999px',
                        background: 'rgba(74,222,128,0.15)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.5, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Local materials */}
              {local_materials && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
                    You will need
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(typeof local_materials === 'string'
                      ? local_materials.split(',')
                      : local_materials
                    ).map((m, i) => (
                      <span key={i} style={{
                        background: 'var(--border)',
                        color: 'var(--muted)',
                        borderRadius: '999px',
                        padding: '3px 10px',
                        fontSize: '12px',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {m.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Prevention */}
              {prevention?.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
                    Prevention
                  </div>
                  {prevention.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                      <span style={{
                        color: 'var(--muted)',
                        fontSize: '12px',
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 600,
                        lineHeight: '1.5',
                        minWidth: '18px',
                        textAlign: 'right',
                        flexShrink: 0,
                      }}>
                        {i + 1}.
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {!treatment_steps?.length && !prevention?.length && (
                <div style={{ color: 'var(--muted)', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                  No organic treatment data available.
                </div>
              )}
            </div>
          )}

          {/* Chemical */}
          {activeTab === 'chemical' && (
            <div>
              {/* Collapsible safety warning */}
              {inorganic?.safety_warning && (
                <div style={{
                  background: 'var(--danger-dim)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setSafetyOpen(o => !o)}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      padding: '12px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <span>⚠️</span>
                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif', fontWeight: 500, textAlign: 'left' }}>
                      Safety Warning
                    </span>
                    <ChevronDown size={14} color="var(--danger)" style={{ transform: safetyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {safetyOpen && (
                    <div style={{ padding: '0 16px 12px 16px', fontSize: '13px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                      {cleanText(inorganic.safety_warning)}
                    </div>
                  )}
                </div>
              )}

              {hasChemicals ? (
                <>
                  {[
                    { list: inorganic?.pesticides,   label: 'Pesticides' },
                    { list: inorganic?.fungicides,   label: 'Fungicides' },
                    { list: inorganic?.insecticides, label: 'Insecticides' },
                  ].map(({ list, label }) => list?.length > 0 && (
                    <div key={label} style={{ marginBottom: '12px' }}>
                      {/* Category header */}
                      <button
                        onClick={() => setExpandedCats(p => ({ ...p, [label]: !p[label] }))}
                        style={{
                          width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                          borderRadius: expandedCats[label] ? '8px 8px 0 0' : '8px',
                          padding: '10px 14px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontWeight: 500, flex: 1, textAlign: 'left' }}>
                          {label}
                        </span>
                        <span style={{
                          background: 'rgba(74,222,128,0.15)', color: 'var(--primary)',
                          borderRadius: '999px', padding: '2px 8px',
                          fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
                        }}>
                          {list.length}
                        </span>
                        <ChevronDown size={14} color="var(--muted)" style={{ transform: expandedCats[label] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                      {/* Products */}
                      {expandedCats[label] && (
                        <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                          {list.map((item, i) => {
                            const name = typeof item === 'string' ? item : item.name || JSON.stringify(item)
                            const itemKey = `${label}-${i}`
                            return (
                              <div key={i} style={{
                                background: 'var(--surface-2)',
                                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                                padding: '10px 14px',
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '14px', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                                    {cleanText(name)}
                                  </div>
                                  {typeof item === 'object' && item.dosage && (
                                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                                      {cleanText(item.dosage)}
                                    </div>
                                  )}
                                </div>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(name).catch(() => {})
                                      setCopiedItem(itemKey)
                                      setTimeout(() => setCopiedItem(null), 1500)
                                    }}
                                    style={{
                                      background: 'var(--border)', border: 'none',
                                      borderRadius: '6px', padding: '4px 8px',
                                      fontSize: '11px', color: 'var(--muted)',
                                      fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                                    }}
                                  >
                                    {copiedItem === itemKey ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Timing info row with icons */}
                  {[
                    { label: 'Application Timing', value: inorganic?.application_timing, icon: '🕐' },
                    { label: 'Re-entry Interval',  value: inorganic?.reentry_interval,   icon: '🛡️' },
                    { label: 'Pre-harvest',         value: inorganic?.pre_harvest_interval, icon: '📅' },
                  ].filter(x => x.value).length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {[
                        { label: 'Application Timing', value: inorganic?.application_timing, icon: '🕐' },
                        { label: 'Re-entry Interval',  value: inorganic?.reentry_interval,   icon: '🛡️' },
                        { label: 'Pre-harvest',         value: inorganic?.pre_harvest_interval, icon: '📅' },
                      ].filter(x => x.value).map(({ label, value, icon }) => (
                        <div key={label} style={{
                          flex: 1, minWidth: '110px',
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                          borderRadius: '8px', padding: '12px',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '18px', marginBottom: '6px' }}>{icon}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}>{label}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{cleanText(value)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                  No chemical treatments recommended for this condition.
                </div>
              )}
            </div>
          )}
        </>)}

        {/* ── Top 3 Predictions ── */}
        {top_3?.length > 0 && card(<>
          <button
            onClick={() => setTop3Open(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {sectionTitle('Other possibilities')}
            {top3Open
              ? <ChevronUp size={16} color="var(--muted)" />
              : <ChevronDown size={16} color="var(--muted)" />
            }
          </button>
          {top3Open && (
            <div style={{ marginTop: '12px' }}>
              {top_3.map((item, i) => {
                const conf = normalizeConfidence(item.confidence)
                return (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                        {item.label || item.disease || item.name || `Option ${i + 1}`}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--primary)', fontFamily: 'Syne, sans-serif' }}>
                        {typeof conf === 'number' ? `${conf.toFixed(1)}%` : conf}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        className="conf-bar-fill"
                        style={{
                          height: '100%',
                          width: `${Math.min(100, typeof conf === 'number' ? conf : 0)}%`,
                          background: 'var(--primary)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>)}

        {/* ── When to Escalate ── */}
        {when_to_escalate && card(
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Info size={16} color="var(--muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              {sectionTitle('When to seek help')}
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.5, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                {when_to_escalate}
              </p>
            </div>
          </div>
        )}

        {/* ── Rating ── */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          {!ratingSubmitted ? (
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                Rate this diagnosis
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginBottom: '16px' }}>
                Was this diagnosis accurate and helpful?
              </div>

              <StarRating size={32} value={rating} onChange={setRating} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', marginBottom: rating > 0 ? '16px' : 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Poor</span>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Excellent</span>
              </div>

              {rating > 0 && (
                <>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Tell us more (optional)..."
                    style={{
                      width: '100%',
                      minHeight: '72px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: 'var(--text)',
                      fontSize: '13px',
                      fontFamily: 'Inter, sans-serif',
                      resize: 'vertical',
                      marginBottom: '12px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                  {ratingError && (
                    <div style={{ fontSize: '12px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif', marginBottom: '8px' }}>
                      {ratingError}
                    </div>
                  )}
                  <button
                    disabled={ratingLoading}
                    onClick={async () => {
                      if (!result?.scan_id) {
                        setRatingError('Cannot rate — scan ID missing')
                        return
                      }
                      setRatingLoading(true)
                      setRatingError('')
                      try {
                        await client.post(`/history/${result.scan_id}/rate`, { rating, comment })
                        setRatingSubmitted(true)
                      } catch {
                        setRatingError('Failed to submit. Please try again.')
                      } finally {
                        setRatingLoading(false)
                      }
                    }}
                    style={{
                      height: '40px',
                      padding: '0 20px',
                      background: ratingLoading ? 'var(--border)' : 'var(--primary)',
                      color: '#0a0f0a',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: ratingLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {ratingLoading && (
                      <div style={{
                        width: '12px', height: '12px',
                        border: '2px solid #0a0f0a', borderTopColor: 'transparent',
                        borderRadius: '999px', animation: 'spin 0.8s linear infinite',
                      }} />
                    )}
                    {ratingLoading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: '40px', height: '40px',
                background: 'rgba(74,222,128,0.15)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', color: 'var(--primary)',
              }}>
                ✓
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginTop: '12px', marginBottom: '8px' }}>
                Thank you for your feedback!
              </div>
              <StarRating value={rating} readonly size={20} />
              {comment && (
                <div style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontStyle: 'italic', marginTop: '8px', maxWidth: '320px' }}>
                  "{comment}"
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginTop: '8px' }}>
                Your feedback helps improve accuracy
              </div>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={() => navigate('/farmer/diagnose')}
            className="action-btn"
            style={{
              flex: 1,
              height: '48px',
              background: 'var(--primary)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            Scan Another Plant
          </button>
          <button
            onClick={() => navigate('/farmer/history')}
            className="action-btn"
            style={{
              flex: 1,
              height: '48px',
              background: 'transparent',
              color: 'var(--primary)',
              border: '1px solid var(--primary)',
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            View History
          </button>
        </div>
      </div>
    </>
  )
}

export default Result

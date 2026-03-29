import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import client from '../../api/client'

const STEPS = [
  {
    label: 'Uploading image...',
    sublabel: 'Compressing and sending your photo',
    icon: '📤',
    duration: 1200,
  },
  {
    label: 'Running disease detection...',
    sublabel: 'Our AI model is analysing leaf patterns',
    icon: '🔬',
    duration: 2000,
  },
  {
    label: 'Generating treatment plan...',
    sublabel: 'Claude AI is writing personalised advice',
    icon: '🌿',
    duration: 1500,
  },
  {
    label: 'Almost ready...',
    sublabel: 'Preparing your diagnosis report',
    icon: '✨',
    duration: 800,
  },
]

const LANGUAGES = [
  { code: 'english', flag: '🇬🇧', label: 'English' },
  { code: 'hindi',   flag: '🇮🇳', label: 'हिंदी' },
  { code: 'nepali',  flag: '🇳🇵', label: 'नेपाली' },
  { code: 'french',  flag: '🇫🇷', label: 'Français' },
  { code: 'german',  flag: '🇩🇪', label: 'Deutsch' },
  { code: 'korean',  flag: '🇰🇷', label: '한국어' },
  { code: 'chinese', flag: '🇨🇳', label: '中文' },
]

const Diagnose = () => {
  const navigate = useNavigate()
  const { user, updateLanguage } = useAuth()
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [language, setLanguage] = useState(
    user?.preferred_language || localStorage.getItem('agrixel_language') || 'english'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)

  const [stats, setStats] = useState(null)
  const [diseases, setDiseases] = useState([])

  useEffect(() => {
    client.get('/me/stats').then(r => setStats(r.data)).catch(() => {})
    client.get('/diseases').then(r => setDiseases(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0)
      setLoadingProgress(0)
      return
    }

    let step = 0
    let progress = 0
    let cancelled = false

    const runStep = () => {
      if (cancelled || step >= STEPS.length) return
      setLoadingStep(step)

      const stepDuration = STEPS[step].duration
      const intervalMs = stepDuration / 50

      const interval = setInterval(() => {
        progress += 2
        setLoadingProgress(Math.min(progress, (step + 1) * (100 / STEPS.length)))
      }, intervalMs)

      setTimeout(() => {
        clearInterval(interval)
        step++
        if (!cancelled && step < STEPS.length) runStep()
      }, stepDuration)
    }

    runStep()
    return () => { cancelled = true }
  }, [loading])

  const handleFile = (f) => {
    if (!f) return
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      setError('Please upload a JPG or PNG image.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleRemove = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDiagnose = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', language)
      const res = await client.post('/diagnose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/farmer/result', { state: { result: res.data } })
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Diagnosis failed. Please try again.'
      setError(typeof msg === 'string' ? msg : 'Diagnosis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  // Extract crop names from diseases response
  const cropNames = Array.isArray(diseases)
    ? diseases.map(d => d.crop || d).filter(Boolean)
    : Object.keys(diseases || {})

  return (
    <>
      <style>{`
        .diagnose-btn:hover:not(:disabled) { opacity: 0.88 !important; }
        .remove-btn:hover { opacity: 1 !important; }
        .upload-choice-btn:hover { border-color: var(--primary) !important; color: var(--primary) !important; }
        @media (max-width: 768px) {
          .diagnose-layout { flex-direction: column !important; }
          .diagnose-sidebar { width: 100% !important; }
        }
      `}</style>

      <div className="diagnose-layout" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* ── LEFT: Upload ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
              {t('diagnose_plant')}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
              Upload a clear photo of the affected leaf or fruit
            </div>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '32px',
          }}>

            {/* Loading experience */}
            {loading ? (
              <div style={{
                padding: '48px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
              }}>
                {/* Animated icon */}
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'var(--primary-dim)',
                  border: '2px solid rgba(74,222,128,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  marginBottom: 24,
                  animation: 'pulse-glow 2s ease infinite',
                  position: 'relative',
                }}>
                  {STEPS[loadingStep]?.icon || '🔬'}
                  <div style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: 'var(--primary)',
                    animation: 'spin 1s linear infinite',
                  }} />
                </div>

                {/* Step label */}
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 8,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  {STEPS[loadingStep]?.label}
                </div>

                {/* Sub label */}
                <div style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  fontFamily: 'Inter, sans-serif',
                  marginBottom: 32,
                  textAlign: 'center',
                }}>
                  {STEPS[loadingStep]?.sublabel}
                </div>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  maxWidth: 320,
                  height: 4,
                  background: 'var(--border)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginBottom: 16,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${loadingProgress}%`,
                    background: 'var(--primary)',
                    borderRadius: 999,
                    transition: 'width 0.1s linear',
                  }} />
                </div>

                {/* Step dots */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                  {STEPS.map((_, i) => (
                    <div key={i} style={{
                      width: i === loadingStep ? 20 : 8,
                      height: 8,
                      borderRadius: 999,
                      background: i <= loadingStep ? 'var(--primary)' : 'var(--border)',
                      transition: 'all 0.3s ease',
                    }} />
                  ))}
                </div>

                {/* Info cards row */}
                <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
                  {[
                    { icon: '🤖', label: 'AI Model',  value: '97.4% accuracy' },
                    { icon: '🌿', label: 'Treatment', value: 'Organic first' },
                    { icon: '⚡', label: 'Analysis',  value: 'Real-time' },
                  ].map((info, i) => (
                    <div key={i} style={{
                      flex: 1,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 8px',
                      textAlign: 'center',
                      animation: `fadeUp 0.4s ease ${i * 0.1}s both`,
                    }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{info.icon}</div>
                      <div style={{
                        fontSize: 10,
                        color: 'var(--muted)',
                        fontFamily: 'Inter, sans-serif',
                        marginBottom: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>{info.label}</div>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--primary)',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                      }}>{info.value}</div>
                    </div>
                  ))}
                </div>

                {/* Tip */}
                <div style={{
                  marginTop: 24,
                  fontSize: 12,
                  color: 'var(--muted)',
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  maxWidth: 300,
                }}>
                  💡 Tip: Better lighting = more accurate results
                </div>
              </div>
            ) : !preview ? (
              /* Drop zone */
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    background: dragOver ? 'rgba(74,222,128,0.03)' : 'transparent',
                    backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Camera size={36} color="var(--muted-2)" />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                      {t('drop_photo')}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-2)', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
                      JPG, PNG up to 5MB
                    </div>
                  </div>
                </div>
                {/* Choose file / Camera buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-choice-btn"
                    style={{
                      flex: 1, height: '40px',
                      background: 'transparent', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--muted)',
                      fontSize: '13px', fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <Upload size={15} />
                    Choose File
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="upload-choice-btn"
                    style={{
                      flex: 1, height: '40px',
                      background: 'transparent', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--muted)',
                      fontSize: '13px', fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <Smartphone size={15} />
                    Use Camera
                  </button>
                </div>
              </>
            ) : (
              /* Preview */
              <div style={{ position: 'relative', height: '240px', borderRadius: '10px', overflow: 'hidden' }}>
                <img
                  src={preview}
                  alt="Plant preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '8px 12px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                    {formatSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={handleRemove}
                  className="remove-btn"
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '24px', height: '24px', borderRadius: '999px',
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    color: 'var(--text)', fontSize: '14px',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: 0.8, transition: 'opacity 0.15s', lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files?.[0])}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files?.[0])}
            />

            {/* Language selector */}
            <div style={{ marginTop: '20px' }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--muted)',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                {t('response_language')}
              </div>
              <select
                value={language}
                onChange={e => { setLanguage(e.target.value); updateLanguage(e.target.value) }}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  paddingRight: '36px',
                }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginTop: '16px',
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

            {/* Diagnose button */}
            <button
              onClick={handleDiagnose}
              disabled={!file || loading}
              className="diagnose-btn"
              style={{
                width: '100%',
                height: '52px',
                marginTop: '16px',
                background: loading ? 'var(--border)' : file ? 'var(--primary)' : 'var(--border)',
                color: loading ? 'var(--muted)' : file ? 'var(--bg)' : 'var(--muted-2)',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                cursor: file && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Analysing...
                </>
              ) : (
                '🔬 Diagnose Plant'
              )}
            </button>

            {/* File ready hint */}
            {file && !loading && (
              <div style={{
                marginTop: 8,
                fontSize: 11,
                color: 'var(--muted)',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
              }}>
                {file.name} · {(file.size / 1024).toFixed(0)}KB ready to analyse
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Stats + Crops ── */}
        <div className="diagnose-sidebar" style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quick Stats */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'Inter, sans-serif',
              marginBottom: '16px',
            }}>
              {t('your_stats')}
            </div>
            {stats ? (
              [
                { label: t('total_scans'),    value: stats.total_scans ?? stats.totalScans ?? '—' },
                { label: t('healthy_plants'), value: stats.healthy_count ?? stats.healthyCount ?? '—' },
                { label: t('avg_confidence'), value: stats.avg_confidence != null ? `${Math.round(stats.avg_confidence)}%` : '—' },
              ].map(({ label, value }, idx, arr) => (
                <div key={label} style={{
                  paddingBottom: idx < arr.length - 1 ? '12px' : 0,
                  marginBottom: idx < arr.length - 1 ? '12px' : 0,
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    lineHeight: 1,
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    {label}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--muted-2)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Loading stats...</div>
            )}
          </div>

          {/* Supported Crops */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'Inter, sans-serif',
              marginBottom: '12px',
            }}>
              {t('supported_crops')}
            </div>
            {cropNames.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cropNames.map((crop, i) => (
                  <span key={i} style={{
                    background: 'var(--primary-dim)',
                    border: '1px solid rgba(74,222,128,0.15)',
                    color: 'var(--primary)',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {crop}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--muted-2)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Loading crops...</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Diagnose

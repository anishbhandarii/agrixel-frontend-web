import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useTheme } from '../context/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import logo from '../assets/logo-notext.png'
import demo from '../assets/demo.png'

const CROPS = [
  { name: 'Tomato',     emoji: '🍅', diseases: 9 },
  { name: 'Potato',     emoji: '🥔', diseases: 3 },
  { name: 'Corn',       emoji: '🌽', diseases: 4 },
  { name: 'Rice',       emoji: '🌾', diseases: 3 },
  { name: 'Apple',      emoji: '🍎', diseases: 4 },
  { name: 'Grape',      emoji: '🍇', diseases: 4 },
  { name: 'Strawberry', emoji: '🍓', diseases: 2 },
  { name: 'Peach',      emoji: '🍑', diseases: 2 },
  { name: 'Orange',     emoji: '🍊', diseases: 1 },
  { name: 'Cherry',     emoji: '🍒', diseases: 2 },
  { name: 'Pepper',     emoji: '🫑', diseases: 2 },
  { name: 'Squash',     emoji: '🥬', diseases: 1 },
]

const STEPS = [
  { emoji: '📷', title: 'Take a Photo',    desc: 'Point your camera at a sick leaf or fruit. No special equipment needed.' },
  { emoji: '🔬', title: 'AI Analyses',     desc: 'Our model trained on 70,000+ plant images identifies the disease instantly.' },
  { emoji: '🌿', title: 'Get Treatment',   desc: 'Receive organic treatment steps using materials available in any village.' },
  { emoji: '📈', title: 'Track Progress',  desc: "Monitor your plant's health over time and see if treatment is working." },
]

const FEATURES = [
  { icon: '🌍', title: 'Works Offline',    desc: 'Disease detection runs on-device. No internet required for diagnosis in remote areas.' },
  { icon: '🗣️', title: '7 Languages',      desc: 'Get treatment advice in English, Hindi, Nepali, French, German, Korean, and Chinese.' },
  { icon: '🎯', title: '97.4% Accuracy',   desc: 'Trained on 70,000+ expert-labeled plant images from PlantVillage and regional datasets.' },
  { icon: '🌿', title: 'Organic First',    desc: 'All treatments prioritize locally available organic materials before chemical options.' },
  { icon: '⚡', title: 'Vision AI Backup', desc: "Low confidence detections are reviewed by Claude's vision AI for maximum accuracy." },
  { icon: '📊', title: 'Health Tracking',  desc: 'Track the same plant weekly and see if your treatment is actually working.' },
]

const Landing = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { theme } = useTheme()
  const [cropHover, setCropHover] = useState(null)
  const [featureHover, setFeatureHover] = useState(null)
  const [stepHover, setStepHover] = useState(null)
  const [navBtnHover, setNavBtnHover] = useState(null)
  const featuresRef = useRef(null)
  const howRef = useRef(null)
  const cropsRef = useRef(null)

  const dashboard = user?.role === 'admin' ? '/admin/overview' : '/farmer/home'

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const navBg = theme === 'dark'
    ? 'rgba(10,15,10,0.85)'
    : 'rgba(245,247,245,0.85)'

  // Shared section label style
  const sLabel = {
    fontSize: '11px',
    color: 'var(--primary)',
    letterSpacing: '0.15em',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    marginBottom: '12px',
    textTransform: 'uppercase',
  }

  const sTitle = {
    fontFamily: 'Syne, sans-serif',
    fontSize: '40px',
    fontWeight: 700,
    color: 'var(--text)',
    lineHeight: 1.15,
    margin: '0 auto 60px',
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 16px rgba(74,222,128,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        @keyframes gradient-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* ── NAVBAR ── */}
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: '64px',
          background: navBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 max(24px, calc((100vw - 1100px) / 2))',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logo} alt="AgriXel" style={{ height: '36px', width: 'auto' }} />
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
              AgriXel
            </span>
          </div>

          {/* Center nav links */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            {[
              { label: 'Features',        ref: featuresRef },
              { label: 'How it Works',    ref: howRef },
              { label: 'Supported Crops', ref: cropsRef },
            ].map(({ label, ref }) => (
              <span
                key={label}
                onClick={() => scrollTo(ref)}
                style={{
                  fontSize: '14px',
                  color: navBtnHover === label ? 'var(--text)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'color 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={() => setNavBtnHover(label)}
                onMouseLeave={() => setNavBtnHover(null)}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ThemeToggle />
            {isAuthenticated ? (
              <button
                onClick={() => navigate(dashboard)}
                style={{
                  height: '36px', padding: '0 18px',
                  background: 'var(--primary)', color: '#0a0f0a',
                  border: 'none', borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', transition: 'opacity 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    height: '36px', padding: '0 18px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)',
                    fontSize: '14px', fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    height: '36px', padding: '0 18px',
                    background: 'var(--primary)', color: '#0a0f0a',
                    border: 'none', borderRadius: '8px',
                    fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: '20%', left: '50%',
            transform: 'translateX(-50%)',
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.7s ease forwards' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--primary-dim)',
              border: '1px solid rgba(74,222,128,0.3)',
              borderRadius: '999px', padding: '6px 16px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--primary)',
                animation: 'pulse-ring 2s infinite',
              }} />
              <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                AI-Powered Plant Disease Detection
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.05,
              color: 'var(--text)',
              maxWidth: '800px',
              margin: '0 auto 20px',
            }}>
              Protect Your Crops<br />
              <span style={{
                background: 'linear-gradient(135deg, #4ade80, #22c55e, #16a34a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                With AI Precision
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              fontWeight: 300,
              color: 'var(--muted)',
              maxWidth: '560px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif',
            }}>
              Upload a photo of your plant. Get instant disease diagnosis and organic
              treatment plans in your language. Built for farmers who need answers, not algorithms.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/register')}
                style={{
                  height: '52px', padding: '0 28px',
                  background: 'var(--primary)', color: '#0a0f0a',
                  border: 'none', borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700,
                  cursor: 'pointer',
                  animation: 'pulse-ring 3s infinite',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                Start Diagnosing Free →
              </button>
              <button
                onClick={() => scrollTo(howRef)}
                style={{
                  height: '52px', padding: '0 28px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '10px', color: 'var(--text)',
                  fontSize: '15px', fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                See How It Works ↓
              </button>
            </div>

            {/* Stats bar */}
            <div style={{
              marginTop: '64px',
              display: 'flex',
              gap: '48px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              paddingTop: '40px',
              borderTop: '1px solid var(--border)',
            }}>
              {[
                { num: '97.4%', label: 'Model Accuracy' },
                { num: '41+',   label: 'Disease Classes' },
                { num: '7',     label: 'Languages Supported' },
              ].map(({ num, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                    {num}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Hero mockup */}
            <div style={{
              maxWidth: '800px',
              margin: '64px auto 0',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
              animation: 'float 6s ease-in-out infinite',
              textAlign: 'left',
            }}>
              {/* Mock browser bar */}
              <div style={{
                height: '40px',
                background: 'var(--surface-2)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: '8px',
              }}>
                {['#ef4444','#fbbf24','#4ade80'].map(c => (
                  <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.8 }} />
                ))}
                <div style={{
                  flex: 1, height: '24px', background: 'var(--bg)',
                  borderRadius: '4px', margin: '0 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                    agrixel.app/farmer/result
                  </span>
                </div>
              </div>

              {/* Demo screenshot */}
              <img
                src={demo}
                alt="AgriXel result page demo"
                style={{ width: '100%', display: 'block' }}
              />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section ref={howRef} id="how-it-works" style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
            <div style={sLabel}>How It Works</div>
            <h2 style={{ ...sTitle, maxWidth: '600px' }}>
              From photo to treatment plan in seconds
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setStepHover(i)}
                  onMouseLeave={() => setStepHover(null)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '32px 24px',
                    textAlign: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    transform: stepHover === i ? 'translateY(-4px)' : 'none',
                    boxShadow: stepHover === i ? '0 12px 32px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'var(--primary-dim)',
                    border: '1px solid rgba(74,222,128,0.3)',
                    color: 'var(--primary)',
                    fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{step.emoji}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section ref={featuresRef} id="features" style={{ background: 'var(--surface)', padding: '100px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
            <div style={sLabel}>Features</div>
            <h2 style={{ ...sTitle, maxWidth: '500px', margin: '0 auto 60px' }}>
              Everything a farmer needs
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'left' }}>
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setFeatureHover(i)}
                  onMouseLeave={() => setFeatureHover(null)}
                  style={{
                    background: 'var(--bg)',
                    border: `1px solid ${featureHover === i ? 'rgba(74,222,128,0.4)' : 'var(--border)'}`,
                    borderRadius: '16px',
                    padding: '28px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: 'var(--primary-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px', fontSize: '22px',
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                    {f.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SUPPORTED CROPS ── */}
        <section ref={cropsRef} id="supported-crops" style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
            <div style={sLabel}>Supported Crops</div>
            <h2 style={{ ...sTitle, marginBottom: '12px', maxWidth: '600px', margin: '0 auto 12px' }}>
              41 diseases across 12 crop types
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginBottom: '48px' }}>
              With more being added regularly
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              {CROPS.map((crop, i) => (
                <div
                  key={crop.name}
                  onMouseEnter={() => setCropHover(i)}
                  onMouseLeave={() => setCropHover(null)}
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${cropHover === i ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    transition: 'all 0.15s',
                    cursor: 'default',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{crop.emoji}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                      {crop.name}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      background: 'var(--primary-dim)',
                      color: 'var(--primary)',
                      borderRadius: '999px', padding: '2px 8px',
                      fontSize: '11px', fontFamily: 'Inter, sans-serif',
                      marginTop: '3px',
                    }}>
                      {crop.diseases} disease{crop.diseases !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,197,94,0.06))',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '80px 24px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '40px',
            fontWeight: 700, color: 'var(--text)',
            margin: '0 auto 16px',
          }}>
            Ready to protect your crops?
          </h2>
          <p style={{
            fontSize: '16px', color: 'var(--muted)',
            fontFamily: 'Inter, sans-serif', marginBottom: '40px',
          }}>
            Join farmers using AI to save their harvests
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                height: '52px', padding: '0 32px',
                background: 'var(--primary)', color: '#0a0f0a',
                border: 'none', borderRadius: '10px',
                fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700,
                cursor: 'pointer', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                height: '52px', padding: '0 32px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '10px', color: 'var(--text)',
                fontSize: '15px', fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Sign In
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '40px 24px',
        }}>
          <div style={{
            maxWidth: '1100px', margin: '0 auto',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '20px',
          }}>
            {/* Left */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={logo} alt="AgriXel" style={{ height: '28px', width: 'auto' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                  AgriXel
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                Smart farming, healthy crops
              </div>
            </div>

            {/* Center links */}
            <div style={{ display: 'flex', gap: '24px' }}>
              {['Privacy', 'Terms', 'Contact'].map(link => (
                <span
                  key={link}
                  style={{
                    fontSize: '12px',
                    color: navBtnHover === link ? 'var(--text)' : 'var(--muted)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={() => setNavBtnHover(link)}
                  onMouseLeave={() => setNavBtnHover(null)}
                >
                  {link}
                </span>
              ))}
            </div>

            {/* Right */}
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
              © 2025 AgriXel. Built for farmers.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default Landing

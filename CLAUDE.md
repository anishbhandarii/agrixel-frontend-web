# Agrixel Frontend

## What this project is
A premium React + Vite web app for Agrixel — an AI-powered plant
disease detection platform targeting farmers in South Asia and beyond.
Built for both farmers and admin/NGO users with separate dashboards.

## App Name
Agrixel

## Backend
- Live: http://64.23.162.250
- Local: http://localhost:8000
- All API calls go through src/api/client.js (axios instance)
- Token stored in localStorage as 'agrixel_token'
- User object stored in localStorage as 'agrixel_user'

## Tech Stack
- React 19 + Vite
- Tailwind v4 (use inline styles when Tailwind classes are unreliable)
- react-router-dom v7
- axios
- react-i18next + i18next
- lucide-react

## Design System
Background:   #0a0f0a  (main bg)
Surface:      #111811  (cards, panels)
Border:       #1e2d1e  (all borders)
Primary:      #4ade80  (green accent, CTAs)
Primary dim:  #166534  (hover states)
Text:         #f0fdf0  (primary text)
Muted:        #6b7280  (secondary text)
Danger:       #f87171  (errors, high urgency)
Warning:      #fbbf24  (medium urgency, caution)

Font display: Syne (headings, logo, buttons)
Font body:    Inter (all other text)

Border radius: 12px cards, 10px buttons, 999px pills
Hover glow: 0 0 20px rgba(74,222,128,0.1)

## Styling Rules — IMPORTANT
- Tailwind v4 does NOT support all utility classes reliably in this setup
- ALWAYS use inline styles for layout, colors, spacing, typography
- Only use Tailwind for simple utilities if confirmed working
- All colors must come from the design system above
- Never use hardcoded colors outside the design system
- Use CSS variables from index.css: var(--bg), var(--surface), etc.

## Supported Languages
  english  → 🇬🇧 English
  hindi    → 🇮🇳 हिंदी
  nepali   → 🇳🇵 नेपाली
  french   → 🇫🇷 Français
  german   → 🇩🇪 Deutsch
  korean   → 🇰🇷 한국어
  chinese  → 🇨🇳 中文

Language saved to localStorage as 'agrixel_language'
i18n setup in src/i18n/index.js

## User Roles
  farmer → /farmer/* routes → FarmerDashboard layout
  admin  → /admin/* routes  → AdminDashboard layout

Role stored in agrixel_user object in localStorage.
After login, check user.role to redirect correctly.

## Project Structure
src/
├── api/
│   └── client.js          ← axios instance, auth interceptor, 401 handler
├── components/
│   └── ui/
│       ├── Button.jsx      ← variant(primary/secondary/danger), size, loading, fullWidth
│       ├── Card.jsx        ← glowOnHover, padding props
│       ├── Input.jsx       ← label, error, icon props
│       └── Badge.jsx       ← success/warning/danger/neutral variants
├── context/
│   └── AuthContext.jsx    ← user, token, isLoading, isAuthenticated
│                             login, register, logout, updateLanguage
├── hooks/
│   └── useAuth.js         ← consumes AuthContext
├── i18n/
│   └── index.js           ← i18next config, all 7 languages, all keys
├── pages/
│   ├── onboarding/
│   │   ├── LanguageSelect.jsx  ← first screen, flag buttons, i18n
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── farmer/
│   │   ├── FarmerDashboard.jsx ← layout wrapper with sidebar/nav
│   │   ├── Diagnose.jsx        ← photo upload + diagnosis
│   │   ├── Result.jsx          ← diagnosis result + treatment
│   │   └── History.jsx         ← past scans with photos
│   └── admin/
│       ├── AdminDashboard.jsx  ← layout wrapper with sidebar/nav
│       ├── Users.jsx           ← user list + toggle active
│       └── Overview.jsx        ← stats, charts, disease data
├── routes/
│   └── AppRouter.jsx      ← all routes, ProtectedRoute, role redirect
├── App.jsx                ← AuthProvider wraps AppRouter
├── main.jsx
└── index.css              ← Google Fonts + @import tailwindcss + CSS vars

## Routing Rules
/ → redirect to /language (no token) or role dashboard (authenticated)
/language → LanguageSelect (public)
/login → Login (public)
/register → Register (public)
/farmer/diagnose → Diagnose (farmer only)
/farmer/result → Result (farmer only)
/farmer/history → History (farmer only)
/admin/overview → Overview (admin only)
/admin/users → Users (admin only)

## Auth Flow
1. User opens app → /language
2. Selects language → saved to localStorage
3. Goes to /login or /register
4. On login: token + user saved to localStorage
5. AppRouter reads token on every load
6. ProtectedRoute checks auth + role
7. 401 response → auto logout + redirect to /login

## API Endpoints Used
POST   /auth/register     → create account
POST   /auth/login        → get JWT token
GET    /me                → current user info
PATCH  /me/language       → update preferred language
POST   /diagnose          → upload image, get diagnosis
GET    /history           → user's scan history
GET    /diseases          → all diseases grouped by crop
GET    /stats             → usage stats (admin)
GET    /admin/users       → all users (admin)
GET    /admin/overview    → system overview (admin)
PATCH  /admin/users/{id}/toggle → toggle user active (admin)
GET    /images/{filename} → serve saved image (authenticated)

## Diagnose Response Shape
{
  scan_id, timestamp, user_id, language,
  raw_label, crop, disease, confidence, health_score,
  is_healthy, top_3, mode, result_type, status,
  explanation, severity_message,
  treatment_steps[],     ← organic — from Claude
  local_materials,
  prevention[],
  urgency,               ← "low"|"medium"|"high"|"none"
  when_to_escalate,
  inorganic: {           ← chemical treatments
    pesticides[],
    fungicides[],
    insecticides[],
    application_timing,
    safety_warning,
    reentry_interval,
    pre_harvest_interval
  },
  image_filename,
  original_size_kb,
  compressed_size_kb,
  compression_ratio,
  caution               ← only present in Tier 2 (75-90% confidence)
}

## Component Rules
- Every page must handle loading state
- Every API call must handle errors gracefully
- Never show raw error messages to users
- Always show a fallback UI if data is missing
- All text must use i18n translation keys
- Forms must validate before submitting

## Build Commands
npm run dev     ← development server on port 5173
npm run build   ← production build
npm run preview ← preview production build

## Pages Status
LanguageSelect  ← in progress
Login           ← placeholder
Register        ← placeholder
FarmerDashboard ← placeholder
Diagnose        ← placeholder
Result          ← placeholder
History         ← placeholder
AdminDashboard  ← placeholder
Users           ← placeholder
Overview        ← placeholder

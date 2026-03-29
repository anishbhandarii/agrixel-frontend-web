import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../i18n/index.js'

import Landing from '../pages/Landing'
import LanguageSelect from '../pages/onboarding/LanguageSelect'
import Login from '../pages/onboarding/Login'
import Register from '../pages/onboarding/Register'
import FarmerDashboard from '../pages/farmer/FarmerDashboard'
import Home from '../pages/farmer/Home'
import Diagnose from '../pages/farmer/Diagnose'
import Result from '../pages/farmer/Result'
import History from '../pages/farmer/History'
import AdminDashboard from '../pages/admin/AdminDashboard'
import Overview from '../pages/admin/Overview'
import Users from '../pages/admin/Users'

const Spinner = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0f0a',
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '2px solid #4ade80',
      borderTopColor: 'transparent',
      borderRadius: '999px',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
  </div>
)

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (requiredRole && user?.role !== requiredRole) {
    const redirect = user?.role === 'admin' ? '/admin/overview' : '/farmer/home'
    return <Navigate to={redirect} replace />
  }

  return children
}

const RootRedirect = () => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/language" replace />

  const dashboard = user?.role === 'admin' ? '/admin/overview' : '/farmer/home'
  return <Navigate to={dashboard} replace />
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root — always public, Landing handles auth-aware navbar */}
        <Route path="/" element={<Landing />} />

        {/* Public routes */}
        <Route path="/language" element={<LanguageSelect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Farmer routes — nested layout */}
        <Route
          path="/farmer"
          element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="home"     element={<Home />} />
          <Route path="diagnose" element={<Diagnose />} />
          <Route path="result"   element={<Result />} />
          <Route path="history"  element={<History />} />
          <Route path="tracker"  element={<div style={{ color: '#f0fdf0', fontFamily: 'Syne, sans-serif', fontSize: '18px' }}>Plant Tracker — Coming Soon</div>} />
          <Route index element={<Navigate to="home" replace />} />
        </Route>

        {/* Admin routes — nested layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="overview"  element={<Overview />} />
          <Route path="users"     element={<Users />} />
          <Route path="activity"  element={
            <div style={{ color: '#6b7280', padding: '40px', textAlign: 'center', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
              Disease Activity Map — Coming Soon
            </div>
          } />
          <Route index element={<Navigate to="overview" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter

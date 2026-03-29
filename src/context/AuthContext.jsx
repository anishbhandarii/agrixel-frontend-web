import { createContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import i18n from '../i18n/index'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('agrixel_token')
    const storedUser = localStorage.getItem('agrixel_user')
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
        const lang = parsedUser.preferred_language || localStorage.getItem('agrixel_language') || 'english'
        localStorage.setItem('agrixel_language', lang)
        i18n.changeLanguage(lang)
      } catch {
        localStorage.removeItem('agrixel_token')
        localStorage.removeItem('agrixel_user')
      }
    }
    setIsLoading(false)
  }, [])

  // Backend uses OAuth2PasswordRequestForm — must send form-encoded, field is 'username'
  const login = useCallback(async (email, password) => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const res = await client.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    // Backend returns flat LoginResponse — build user object from it
    const { access_token, user_id, email: userEmail, full_name, role, preferred_language } = res.data
    const userData = { id: user_id, email: userEmail, full_name, role, preferred_language }

    localStorage.setItem('agrixel_token', access_token)
    localStorage.setItem('agrixel_user', JSON.stringify(userData))
    const lang = userData.preferred_language || 'english'
    localStorage.setItem('agrixel_language', lang)
    i18n.changeLanguage(lang)
    setToken(access_token)
    setUser(userData)
    return userData
  }, [])

  // Backend register returns { message, email } only — no auto-login
  const register = useCallback(async (email, password, fullName, preferredLanguage, region) => {
    const res = await client.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      preferred_language: preferredLanguage,
      region: region || null,
    })
    return res.data // { message, email }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('agrixel_token')
    localStorage.removeItem('agrixel_user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }, [])

  // Backend LanguageUpdateRequest uses field 'language', not 'preferred_language'
  const updateLanguage = useCallback(async (language) => {
    try {
      await client.patch('/me/language', { language })
      const updatedUser = { ...user, preferred_language: language }
      localStorage.setItem('agrixel_user', JSON.stringify(updatedUser))
      localStorage.setItem('agrixel_language', language)
      i18n.changeLanguage(language)
      setUser(updatedUser)
    } catch (err) {
      console.error('Language update failed:', err)
    }
  }, [user])

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, register, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  )
}

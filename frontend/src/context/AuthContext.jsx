import { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem('shivani_email'))
  const [role, setRole] = useState(localStorage.getItem('shivani_role'))

  const persistSession = useCallback((data) => {
    localStorage.setItem('shivani_token', data.token)
    localStorage.setItem('shivani_role', data.role)
    localStorage.setItem('shivani_email', data.email)
    setEmail(data.email)
    setRole(data.role)
  }, [])

  const login = useCallback(
    async (credentials) => {
      const { data } = await client.post('/api/auth/login', credentials)
      persistSession(data)
      return data
    },
    [persistSession],
  )

  const registerCandidate = useCallback(
    async (payload) => {
      const { data } = await client.post('/api/auth/register/candidate', payload)
      persistSession(data)
      return data
    },
    [persistSession],
  )

  const registerCompany = useCallback(
    async (payload) => {
      const { data } = await client.post('/api/auth/register/company', payload)
      persistSession(data)
      return data
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('shivani_token')
    localStorage.removeItem('shivani_role')
    localStorage.removeItem('shivani_email')
    setEmail(null)
    setRole(null)
  }, [])

  const value = {
    email,
    role,
    isAuthenticated: Boolean(email && role),
    login,
    registerCandidate,
    registerCompany,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

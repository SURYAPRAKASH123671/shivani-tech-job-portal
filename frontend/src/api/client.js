import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('shivani_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Login/register/OTP calls report 401 for normal reasons (wrong password, etc.) -
    // those pages already show their own inline error and must not be interrupted.
    const isAuthEndpoint = error.config?.url?.startsWith('/api/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('shivani_token')
      localStorage.removeItem('shivani_role')
      localStorage.removeItem('shivani_email')
      // A full reload (not client-side navigate) so AuthContext re-initializes from the
      // now-empty localStorage - otherwise the navbar keeps showing the old logged-in state.
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default client

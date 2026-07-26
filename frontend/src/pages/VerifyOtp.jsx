import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import client from '../api/client.js'

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      await client.post('/api/auth/verify-otp', { email, otp })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'That code did not work. Try again or request a new one.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setError(null)
    setMessage(null)
    setResending(true)
    try {
      await client.post('/api/auth/resend-otp', { email })
      setMessage('A new code has been sent.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend a code right now.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="One more step"
      title="Verify your email"
      subtitle="We sent a 6-digit code to your email address. Enter it below to activate your account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="otp">
            Verification code
          </label>
          <input
            id="otp"
            required
            inputMode="numeric"
            maxLength={6}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm tracking-widest focus:border-navy focus:outline-none"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-navy py-2.5 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
        >
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Didn't get a code?{' '}
        <button
          type="button"
          onClick={resend}
          disabled={resending || !email}
          className="font-medium text-navy hover:underline disabled:opacity-60"
        >
          {resending ? 'Sending…' : 'Resend it'}
        </button>
      </p>
    </AuthLayout>
  )
}

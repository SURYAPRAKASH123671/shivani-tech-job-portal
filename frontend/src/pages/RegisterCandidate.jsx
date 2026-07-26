import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterCandidate() {
  const { registerCandidate } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await registerCandidate(form)
      if (data.verified) {
        navigate('/candidate/dashboard')
      } else {
        navigate('/verify-otp', { state: { email: form.email } })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  return (
    <AuthLayout
      eyebrow="Candidates"
      title="Create your candidate account"
      subtitle="Search openings and apply in a couple of clicks."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="fullName">
            Full name <span className="text-danger">*</span>
          </label>
          <input
            id="fullName"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.fullName}
            onChange={update('fullName')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="email">
            Email <span className="text-danger">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.phone}
            onChange={update('phone')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="password">
            Password <span className="text-danger">*</span>
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.password}
            onChange={update('password')}
          />
          <p className="mt-1 text-xs text-muted">At least 6 characters.</p>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-navy hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}

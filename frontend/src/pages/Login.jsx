import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login(form)
      if (data.role === 'CANDIDATE' && !data.verified) {
        navigate('/verify-otp', { state: { email: form.email } })
      } else if (data.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else if (data.role === 'EMPLOYER') {
        navigate('/employer/dashboard')
      } else if (data.role === 'EMPLOYEE') {
        navigate('/employee/dashboard')
      } else if (data.role === 'CANDIDATE') {
        navigate('/candidate/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Log in to your account">
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
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-navy py-2.5 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        New here?{' '}
        <Link to="/register/candidate" className="font-medium text-navy hover:underline">
          Create a candidate account
        </Link>{' '}
        or{' '}
        <Link to="/register/company" className="font-medium text-navy hover:underline">
          register your company
        </Link>
        .
      </p>
    </AuthLayout>
  )
}

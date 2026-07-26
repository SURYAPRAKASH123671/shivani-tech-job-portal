import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterCompany() {
  const { registerCompany } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    contactEmail: '',
    contactPhone: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await registerCompany(form)
      navigate('/employer/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register your company. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  return (
    <AuthLayout
      eyebrow="Employer zone"
      title="Register your company"
      subtitle="An admin verifies every company before it can post openings."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="companyName">
            Company name
          </label>
          <input
            id="companyName"
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.companyName}
            onChange={update('companyName')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="email">
            Login email
          </label>
          <input
            id="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="contactEmail">
              Contact email
            </label>
            <input
              id="contactEmail"
              type="email"
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
              value={form.contactEmail}
              onChange={update('contactEmail')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="contactPhone">
              Contact phone
            </label>
            <input
              id="contactPhone"
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
              value={form.contactPhone}
              onChange={update('contactPhone')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.password}
            onChange={update('password')}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-navy py-2.5 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
        >
          {loading ? 'Submitting…' : 'Register company'}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Looking for a job instead?{' '}
        <Link to="/register/candidate" className="font-medium text-navy hover:underline">
          Create a candidate account
        </Link>
      </p>
    </AuthLayout>
  )
}

import { useEffect, useState } from 'react'
import client from '../api/client.js'

const emptyForm = { fullName: '', designation: '', email: '', password: '' }

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await client.get('/api/admin/employees')
      setEmployees(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load employees.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await client.post('/api/admin/employees', form)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create that employee.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleEnabled(employee) {
    setBusyId(employee.id)
    try {
      await client.patch(`/api/admin/employees/${employee.id}/${employee.enabled ? 'disable' : 'enable'}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update that employee.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Admin</p>
      <h1 className="mt-2 text-3xl">Employees</h1>
      <p className="mt-2 text-muted">Create logins for internal staff. Each gets their own email and password.</p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-line bg-surface p-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">Full name</label>
          <input
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.fullName}
            onChange={update('fullName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Designation</label>
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            placeholder="e.g. Recruiter"
            value={form.designation}
            onChange={update('designation')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Login email</label>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.email}
            onChange={update('email')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.password}
            onChange={update('password')}
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create employee'}
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={5}>
                  No employees yet.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{emp.fullName}</td>
                  <td className="px-4 py-3 text-muted">{emp.designation || '—'}</td>
                  <td className="px-4 py-3 text-muted">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        emp.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {emp.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={busyId === emp.id}
                      onClick={() => toggleEnabled(emp)}
                      className="text-xs font-medium text-navy hover:underline disabled:opacity-60"
                    >
                      {emp.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import client from '../api/client.js'

const statusStyles = {
  PENDING: 'bg-amber/20 text-amber-dark',
  ACTIVE: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  VERIFIED: 'bg-green-100 text-green-800',
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await client.get('/api/admin/companies', {
        params: statusFilter ? { status: statusFilter } : {},
      })
      setCompanies(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load companies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function act(id, action) {
    setBusyId(id)
    try {
      await client.patch(`/api/admin/companies/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || `Could not ${action} that company.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Admin</p>
      <h1 className="mt-2 text-3xl">Registered companies</h1>
      <p className="mt-2 text-muted">
        Verify a company after checking its details by phone or mail before it can post openings.
      </p>

      <div className="mt-6 flex gap-2">
        {['', 'PENDING', 'ACTIVE', 'REJECTED'].map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              statusFilter === s ? 'border-navy bg-navy text-white' : 'border-line text-ink hover:border-navy'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Login email</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  No companies match this filter.
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.ownerEmail}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.contactEmail}
                    {c.contactPhone ? ` · ${c.contactPhone}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[c.status] || ''}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-4 py-3">
                    {c.status !== 'ACTIVE' && (
                      <button
                        disabled={busyId === c.id}
                        onClick={() => act(c.id, 'verify')}
                        className="mr-2 rounded-md border border-line px-3 py-1 text-xs font-medium text-ink hover:border-navy hover:text-navy disabled:opacity-60"
                      >
                        Verify
                      </button>
                    )}
                    {c.status !== 'REJECTED' && (
                      <button
                        disabled={busyId === c.id}
                        onClick={() => act(c.id, 'reject')}
                        className="rounded-md border border-line px-3 py-1 text-xs font-medium text-danger hover:border-danger disabled:opacity-60"
                      >
                        Reject
                      </button>
                    )}
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

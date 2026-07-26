import { useEffect, useMemo, useState } from 'react'
import client from '../api/client.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import WelcomeHeader from '../components/ui/WelcomeHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Toast from '../components/Toast.jsx'
import { useSortedData, SortableHeader } from '../lib/useSortedData.jsx'

const PAGE_SIZE = 8

const statusVariant = { PENDING: 'amber', ACTIVE: 'success', REJECTED: 'danger' }

const emptyForm = { companyName: '', email: '', password: '', contactEmail: '', contactPhone: '' }

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null) // { company, action: 'verify' | 'reject' }

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
    setPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await client.post('/api/admin/companies', form)
      setForm(emptyForm)
      setToast({ type: 'success', message: 'Company created and activated.' })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create that company.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmAction() {
    const { company, action } = confirmTarget
    setBusyId(company.id)
    try {
      await client.patch(`/api/admin/companies/${company.id}/${action}`)
      setToast({ type: 'success', message: `Company ${action === 'verify' ? 'verified' : 'rejected'}.` })
      await load()
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || `Could not ${action} that company.` })
    } finally {
      setBusyId(null)
      setConfirmTarget(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return companies
    return companies.filter((c) => c.name.toLowerCase().includes(q) || c.ownerEmail.toLowerCase().includes(q))
  }, [companies, search])

  const { sorted, sortKey, sortDir, toggleSort } = useSortedData(filtered, 'name')
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1
  const pageItems = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Companies' }]} />
      <div className="mt-3">
        <WelcomeHeader
          eyebrow="Admin"
          title="Registered companies"
          subtitle="Verify a company after checking its details by phone or mail before it can post openings, or create one directly for a recruiter you already know."
        />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">
            Company name <span className="text-danger">*</span>
          </label>
          <input
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.companyName}
            onChange={update('companyName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">
            Login email <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.email}
            onChange={update('email')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">
            Password <span className="text-danger">*</span>
          </label>
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.password}
            onChange={update('password')}
          />
          <p className="mt-1 text-xs text-muted">At least 6 characters.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Contact email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.contactEmail}
            onChange={update('contactEmail')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Contact phone</label>
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={form.contactPhone}
            onChange={update('contactPhone')}
          />
        </div>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create company'}
          </Button>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
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
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search by name or email…" className="w-full sm:w-72" />
      </div>

      <div className="mt-6 max-h-[32rem] overflow-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-line bg-surface text-muted">
            <tr>
              <SortableHeader label="Company" sortKeyName="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3">Login email</th>
              <th className="px-4 py-3">Contact</th>
              <SortableHeader label="Status" sortKeyName="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Registered" sortKeyName="createdAt" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[8rem]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr>
                <td className="px-4 py-8" colSpan={6}>
                  <EmptyState title="No companies match this filter" description="Try clearing the search or status filter." />
                </td>
              </tr>
            ) : (
              pageItems.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.ownerEmail}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.contactEmail}
                    {c.contactPhone ? ` · ${c.contactPhone}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[c.status] || 'neutral'}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</td>
                  <td className="px-4 py-3">
                    {c.status !== 'ACTIVE' && (
                      <button
                        disabled={busyId === c.id}
                        onClick={() => setConfirmTarget({ company: c, action: 'verify' })}
                        className="mr-2 rounded-md border border-line px-3 py-1 text-xs font-medium text-ink hover:border-navy hover:text-navy disabled:opacity-60"
                      >
                        Verify
                      </button>
                    )}
                    {c.status !== 'REJECTED' && (
                      <button
                        disabled={busyId === c.id}
                        onClick={() => setConfirmTarget({ company: c, action: 'reject' })}
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

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === 'verify' ? 'Verify this company?' : 'Reject this company?'}
        description={
          confirmTarget?.action === 'verify'
            ? `"${confirmTarget?.company.name}" will be able to post job openings immediately, and they'll be notified by email/SMS.`
            : `"${confirmTarget?.company.name}" will be marked rejected and notified by email/SMS. You can still verify them later if this was a mistake.`
        }
        confirmLabel={confirmTarget?.action === 'verify' ? 'Verify' : 'Reject'}
        tone={confirmTarget?.action === 'reject' ? 'danger' : 'primary'}
        busy={busyId === confirmTarget?.company.id}
        onConfirm={confirmAction}
        onCancel={() => setConfirmTarget(null)}
      />

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

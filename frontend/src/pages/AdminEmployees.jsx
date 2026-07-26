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

const emptyForm = { fullName: '', designation: '', email: '', password: '' }

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

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
      setToast({ type: 'success', message: 'Employee created.' })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create that employee.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmToggle() {
    const employee = confirmTarget
    setBusyId(employee.id)
    try {
      await client.patch(`/api/admin/employees/${employee.id}/${employee.enabled ? 'disable' : 'enable'}`)
      setToast({ type: 'success', message: `${employee.fullName} ${employee.enabled ? 'disabled' : 'enabled'}.` })
      await load()
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not update that employee.' })
    } finally {
      setBusyId(null)
      setConfirmTarget(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => e.fullName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
  }, [employees, search])

  const { sorted, sortKey, sortDir, toggleSort } = useSortedData(filtered, 'fullName')
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1
  const pageItems = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Employees' }]} />
      <div className="mt-3">
        <WelcomeHeader eyebrow="Admin" title="Employees" subtitle="Create logins for internal staff. Each gets their own email and password." />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">
            Full name <span className="text-danger">*</span>
          </label>
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
        <div className="sm:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create employee'}
          </Button>
        </div>
      </form>

      <div className="mt-8 flex justify-end">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search by name or email…" className="w-full sm:w-72" />
      </div>

      <div className="mt-4 max-h-[32rem] overflow-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-line bg-surface text-muted">
            <tr>
              <SortableHeader label="Name" sortKeyName="fullName" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Email</th>
              <SortableHeader label="Status" sortKeyName="enabled" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[7rem]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr>
                <td className="px-4 py-8" colSpan={5}>
                  <EmptyState title="No employees yet" description="Create the first one using the form above." />
                </td>
              </tr>
            ) : (
              pageItems.map((emp) => (
                <tr key={emp.id} className="border-b border-line last:border-0 hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{emp.fullName}</td>
                  <td className="px-4 py-3 text-muted">{emp.designation || '—'}</td>
                  <td className="px-4 py-3 text-muted">{emp.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.enabled ? 'success' : 'neutral'}>{emp.enabled ? 'Active' : 'Disabled'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={busyId === emp.id}
                      onClick={() => setConfirmTarget(emp)}
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

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.enabled ? 'Disable this employee?' : 'Enable this employee?'}
        description={
          confirmTarget?.enabled
            ? `${confirmTarget?.fullName} will be signed out immediately - any active session's token stops working right away, not just future logins.`
            : `${confirmTarget?.fullName} will be able to log in again.`
        }
        confirmLabel={confirmTarget?.enabled ? 'Disable' : 'Enable'}
        tone={confirmTarget?.enabled ? 'danger' : 'primary'}
        busy={busyId === confirmTarget?.id}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmTarget(null)}
      />

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

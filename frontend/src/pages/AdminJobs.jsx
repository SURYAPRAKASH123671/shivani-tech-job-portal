import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

const emptyForm = {
  title: '',
  description: '',
  categoryId: '',
  designationId: '',
  locationId: '',
  skillIds: [],
  salaryMin: '',
  salaryMax: '',
  experienceMin: '',
  experienceMax: '',
  qualification: '',
}

function jobToForm(job) {
  return {
    title: job.title || '',
    description: job.description || '',
    categoryId: job.categoryId || '',
    designationId: job.designationId || '',
    locationId: job.locationId || '',
    skillIds: job.skillIds || [],
    salaryMin: job.salaryMin ?? '',
    salaryMax: job.salaryMax ?? '',
    experienceMin: job.experienceMin ?? '',
    experienceMax: job.experienceMax ?? '',
    qualification: job.qualification || '',
  }
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState([])
  const [source, setSource] = useState('') // '' | 'admin' | 'employer'
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [lookups, setLookups] = useState({ categories: [], designations: [], locations: [], skills: [] })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingJob, setEditingJob] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null) // { job, action: 'close' | 'delete' }

  async function loadJobs() {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (source === 'admin') params.postedByAdmin = true
      if (source === 'employer') params.postedByAdmin = false
      const { data } = await client.get('/api/admin/jobs', { params })
      setJobs(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load jobs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
    setPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  useEffect(() => {
    async function loadLookups() {
      const [categories, designations, locations, skills] = await Promise.all([
        client.get('/api/admin/categories'),
        client.get('/api/admin/designations'),
        client.get('/api/admin/locations'),
        client.get('/api/admin/skills'),
      ])
      setLookups({
        categories: categories.data,
        designations: designations.data,
        locations: locations.data,
        skills: skills.data,
      })
    }
    loadLookups().catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return jobs
    return jobs.filter((j) => j.title.toLowerCase().includes(q) || (j.companyName || '').toLowerCase().includes(q))
  }, [jobs, search])

  const { sorted, sortKey, sortDir, toggleSort } = useSortedData(filtered, 'title')
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1
  const pageItems = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  function updateSkills(e) {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
    setForm({ ...form, skillIds: selected })
  }

  async function submitJob(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
        salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
        experienceMin: form.experienceMin === '' ? null : Number(form.experienceMin),
        experienceMax: form.experienceMax === '' ? null : Number(form.experienceMax),
      }
      if (editingJob) {
        await client.put(`/api/admin/jobs/${editingJob.id}`, payload)
        setToast({ type: 'success', message: 'Job updated.' })
      } else {
        await client.post('/api/admin/jobs', payload)
        setToast({ type: 'success', message: 'Job posted.' })
      }
      setForm(emptyForm)
      setEditingJob(null)
      setShowForm(false)
      await loadJobs()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post this job.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmAction() {
    const { job, action } = confirmTarget
    setBusyId(job.id)
    try {
      if (action === 'close') {
        await client.patch(`/api/admin/jobs/${job.id}/close`)
        setToast({ type: 'success', message: 'Job closed.' })
      } else {
        await client.delete(`/api/admin/jobs/${job.id}`)
        setToast({ type: 'success', message: 'Job deleted.' })
      }
      await loadJobs()
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || `Could not ${action} that job.` })
    } finally {
      setBusyId(null)
      setConfirmTarget(null)
    }
  }

  function startEditing(job) {
    setError(null)
    setForm(jobToForm(job))
    setEditingJob(job)
    setShowForm(true)
  }

  function toggleForm() {
    if (showForm) {
      setForm(emptyForm)
      setEditingJob(null)
    }
    setShowForm((visible) => !visible)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'All jobs' }]} />
      <div className="mt-3">
        <WelcomeHeader
          eyebrow="Admin"
          title="All job openings"
          subtitle="Every job in the system, posted by admins or by verified companies."
          action={<Button onClick={toggleForm}>{showForm ? 'Cancel' : 'Post a job'}</Button>}
        />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {showForm && (
        <form onSubmit={submitJob} className="mt-6 space-y-4 rounded-xl border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-navy">{editingJob ? 'Edit job opening' : 'Post a job opening'}</h2>
          <div>
            <label className="block text-sm font-medium text-ink">
              Title <span className="text-danger">*</span>
            </label>
            <input
              required
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
              value={form.title}
              onChange={update('title')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Description</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
              value={form.description}
              onChange={update('description')}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select label="Category" required value={form.categoryId} onChange={update('categoryId')} options={lookups.categories} />
            <Select
              label="Designation"
              required
              value={form.designationId}
              onChange={update('designationId')}
              options={lookups.designations}
            />
            <Select label="Location" required value={form.locationId} onChange={update('locationId')} options={lookups.locations} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Skills (ctrl/cmd-click to select multiple)</label>
            <select
              multiple
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
              value={form.skillIds}
              onChange={updateSkills}
            >
              {lookups.skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted">Min salary (₹)</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
                value={form.salaryMin}
                onChange={update('salaryMin')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Max salary (₹)</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
                value={form.salaryMax}
                onChange={update('salaryMax')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Min experience (yrs)</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
                value={form.experienceMin}
                onChange={update('experienceMin')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Max experience (yrs)</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
                value={form.experienceMax}
                onChange={update('experienceMax')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Qualification</label>
            <input
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
              placeholder="e.g. B.Tech"
              value={form.qualification}
              onChange={update('qualification')}
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? (editingJob ? 'Saving…' : 'Posting…') : editingJob ? 'Save changes' : 'Post job'}
          </Button>
        </form>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            ['', 'All'],
            ['admin', 'Posted by admin'],
            ['employer', 'Posted by companies'],
          ].map(([value, label]) => (
            <button
              key={value || 'ALL'}
              onClick={() => setSource(value)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                source === value ? 'border-navy bg-navy text-white' : 'border-line text-ink hover:border-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search by title or company…" className="w-full sm:w-72" />
      </div>

      {search && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setSearch('')}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 text-xs font-medium text-navy hover:bg-navy/10"
          >
            "{search}" <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      <div className="mt-6 max-h-[32rem] overflow-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-line bg-surface text-muted">
            <tr>
              <SortableHeader label="Title" sortKeyName="title" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Company" sortKeyName="companyName" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Location" sortKeyName="location" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3">Posted by</th>
              <SortableHeader label="Status" sortKeyName="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
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
                  <EmptyState title="No jobs match this filter" description="Try clearing the search or filter." />
                </td>
              </tr>
            ) : (
              pageItems.map((job) => (
                <tr key={job.id} className="border-b border-line last:border-0 hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{job.title}</td>
                  <td className="px-4 py-3 text-muted">{job.companyName || '—'}</td>
                  <td className="px-4 py-3 text-muted">{job.location}</td>
                  <td className="px-4 py-3 text-muted">{job.postedByAdmin ? 'Admin' : 'Company'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={job.status === 'OPEN' ? 'success' : 'neutral'}>{job.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/jobs/${job.id}`} className="font-medium text-navy hover:underline">
                        View
                      </Link>
                      <button
                        disabled={busyId === job.id}
                        onClick={() => startEditing(job)}
                        className="text-xs font-medium text-navy hover:underline disabled:opacity-60"
                      >
                        Edit
                      </button>
                      {job.status === 'OPEN' && (
                        <button
                          disabled={busyId === job.id}
                          onClick={() => setConfirmTarget({ job, action: 'close' })}
                          className="text-xs font-medium text-ink hover:underline disabled:opacity-60"
                        >
                          Close
                        </button>
                      )}
                      <button
                        disabled={busyId === job.id}
                        onClick={() => setConfirmTarget({ job, action: 'delete' })}
                        className="text-xs font-medium text-danger hover:underline disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
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
        title={confirmTarget?.action === 'delete' ? 'Delete this job?' : 'Close this job?'}
        description={
          confirmTarget?.action === 'delete'
            ? `"${confirmTarget?.job.title}" will be permanently deleted. This can't be undone.`
            : `"${confirmTarget?.job.title}" will stop accepting applications.`
        }
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete' : 'Close job'}
        tone={confirmTarget?.action === 'delete' ? 'danger' : 'primary'}
        busy={busyId === confirmTarget?.job.id}
        onConfirm={confirmAction}
        onCancel={() => setConfirmTarget(null)}
      />

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select
        required={required}
        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
        value={value}
        onChange={onChange}
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  )
}

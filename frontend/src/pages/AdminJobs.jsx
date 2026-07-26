import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'

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
  const [lookups, setLookups] = useState({ categories: [], designations: [], locations: [], skills: [] })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingJob, setEditingJob] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

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
      } else {
        await client.post('/api/admin/jobs', payload)
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

  async function closeJob(id) {
    setBusyId(id)
    try {
      await client.patch(`/api/admin/jobs/${id}/close`)
      await loadJobs()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not close that job.')
    } finally {
      setBusyId(null)
    }
  }

  async function deleteJob(id) {
    setBusyId(id)
    try {
      await client.delete(`/api/admin/jobs/${id}`)
      await loadJobs()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete that job.')
    } finally {
      setBusyId(null)
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Admin</p>
          <h1 className="mt-2 text-3xl">All job openings</h1>
          <p className="mt-2 text-muted">Every job in the system, posted by admins or by verified companies.</p>
        </div>
        <button
          onClick={toggleForm}
          className="whitespace-nowrap rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
        >
          {showForm ? 'Cancel' : 'Post a job'}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {showForm && (
        <form onSubmit={submitJob} className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold text-navy">{editingJob ? 'Edit job opening' : 'Post a job opening'}</h2>
          <div>
            <label className="block text-sm font-medium text-ink">Title</label>
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
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
                value={form.salaryMin}
                onChange={update('salaryMin')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Max salary (₹)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
                value={form.salaryMax}
                onChange={update('salaryMax')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Min experience (yrs)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
                value={form.experienceMin}
                onChange={update('experienceMin')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Max experience (yrs)</label>
              <input
                type="number"
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

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
          >
            {submitting ? (editingJob ? 'Saving…' : 'Posting…') : editingJob ? 'Save changes' : 'Post job'}
          </button>
        </form>
      )}

      <div className="mt-6 flex gap-2">
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

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Posted by</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  No jobs match this filter.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{job.title}</td>
                  <td className="px-4 py-3 text-muted">{job.companyName || '—'}</td>
                  <td className="px-4 py-3 text-muted">{job.location}</td>
                  <td className="px-4 py-3 text-muted">{job.postedByAdmin ? 'Admin' : 'Company'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {job.status}
                    </span>
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
                          onClick={() => closeJob(job.id)}
                          className="text-xs font-medium text-ink hover:underline disabled:opacity-60"
                        >
                          Close
                        </button>
                      )}
                      <button
                        disabled={busyId === job.id}
                        onClick={() => deleteJob(job.id)}
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
    </div>
  )
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted">{label}</label>
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

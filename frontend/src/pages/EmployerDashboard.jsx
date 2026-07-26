import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import client from '../api/client.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import WelcomeHeader from '../components/ui/WelcomeHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import ChartCard from '../components/ui/ChartCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { bucketByMonth, groupCount } from '../lib/monthlyBuckets.js'

const COLORS = ['#1B2A4A', '#E8A33D', '#1D9E75', '#2E4374', '#D64545']

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

const statusCopy = {
  PENDING: 'Your company is awaiting admin verification. An admin will confirm your details by phone or mail before you can post jobs.',
  REJECTED: 'Your company registration was rejected. Contact the admin team for details.',
  VERIFIED: 'Your company is verified. You can now post job openings.',
  ACTIVE: 'Your company is verified. You can now post job openings.',
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

export default function EmployerDashboard() {
  const [company, setCompany] = useState(null)
  const [lookups, setLookups] = useState({ categories: [], designations: [], locations: [], skills: [] })
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingJob, setEditingJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function loadAll() {
    setLoading(true)
    try {
      const [companyRes, categories, designations, locations, skills] = await Promise.all([
        client.get('/api/employer/company'),
        client.get('/api/admin/categories'),
        client.get('/api/admin/designations'),
        client.get('/api/admin/locations'),
        client.get('/api/admin/skills'),
      ])
      setCompany(companyRes.data)
      setLookups({
        categories: categories.data,
        designations: designations.data,
        locations: locations.data,
        skills: skills.data,
      })
      if (companyRes.data.status === 'ACTIVE' || companyRes.data.status === 'VERIFIED') {
        const [jobsRes, applicationsRes] = await Promise.all([
          client.get('/api/employer/jobs'),
          client.get('/api/employer/applications'),
        ])
        setJobs(jobsRes.data)
        setApplications(applicationsRes.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setMessage(null)
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
        await client.put(`/api/employer/jobs/${editingJob.id}`, payload)
      } else {
        await client.post('/api/employer/jobs', payload)
      }
      setForm(emptyForm)
      setEditingJob(null)
      setMessage(editingJob ? 'Job updated.' : 'Job posted.')
      const jobsRes = await client.get('/api/employer/jobs')
      setJobs(jobsRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post this job.')
    } finally {
      setSubmitting(false)
    }
  }

  async function closeJob(id) {
    try {
      await client.patch(`/api/employer/jobs/${id}/close`)
      const jobsRes = await client.get('/api/employer/jobs')
      setJobs(jobsRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not close that job.')
    }
  }

  function startEditing(job) {
    setError(null)
    setMessage(null)
    setForm(jobToForm(job))
    setEditingJob(job)
  }

  function cancelEditing() {
    setForm(emptyForm)
    setEditingJob(null)
  }

  const canPost = company && (company.status === 'ACTIVE' || company.status === 'VERIFIED')

  const jobStatusData = groupCount(jobs, 'status')
  const applicationsPerJob = groupCount(applications, 'jobTitle')
  const monthlyApplications = bucketByMonth(applications, 'appliedAt')
  const newApplications = applications.filter((a) => a.status === 'APPLIED').length
  const recentApplicants = [...applications].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Employer', to: '/employer/dashboard' }, { label: 'Dashboard' }]} />
      <div className="mt-3">
        <WelcomeHeader eyebrow="Employer zone" title={loading ? 'Loading…' : company?.name} subtitle={statusCopy[company?.status] || ''} />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {message && <p className="mt-4 text-sm text-success">{message}</p>}

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCard key={i} icon="briefcase" label="" value="" loading />
          ))}
        </div>
      ) : (
        canPost && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon="briefcase" label="Jobs posted" value={jobs.length} />
              <StatCard icon="checkCircle" label="Active jobs" value={jobs.filter((j) => j.status === 'OPEN').length} tone="success" />
              <StatCard icon="xCircle" label="Closed jobs" value={jobs.filter((j) => j.status === 'CLOSED').length} tone="danger" />
              <StatCard icon="layers" label="Total applications" value={applications.length} tone="amber" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartCard title="Applications per job" loading={false} isEmpty={applicationsPerJob.length === 0} emptyMessage="No applications yet - once candidates apply, this breaks down by job.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationsPerJob} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip />
                    <Bar dataKey="value" name="Applications" fill="#1B2A4A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Job status distribution" loading={false} isEmpty={jobStatusData.length === 0} emptyMessage="Post a job to see this breakdown.">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={jobStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {jobStatusData.map((entry, i) => (
                        <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Monthly applications" subtitle="Last 6 months" loading={false} isEmpty={monthlyApplications.every((m) => m.count === 0)} emptyMessage="No applications yet.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyApplications}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip />
                    <Bar dataKey="count" name="Applications" fill="#E8A33D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="rounded-xl border border-line bg-surface p-5">
                <p className="font-display text-sm font-semibold text-navy">Recent applicants</p>
                <p className="mt-0.5 text-xs text-muted">{newApplications} new since applying</p>
                {recentApplicants.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState title="No applicants yet" description="Once candidates apply to your jobs, they'll show up here." />
                  </div>
                ) : (
                  <div className="mt-3 divide-y divide-line">
                    {recentApplicants.map((app) => (
                      <div key={app.applicationId} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{app.candidateName}</p>
                          <p className="truncate text-xs text-muted">{app.jobTitle}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-navy/10 px-2.5 py-1 text-xs font-medium text-navy">{app.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )
      )}

      {!loading && canPost && (
        <>
          <form onSubmit={submitJob} className="mt-8 space-y-4 rounded-xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-semibold text-navy">{editingJob ? 'Edit job opening' : 'Post a job opening'}</h2>

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

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? (editingJob ? 'Saving…' : 'Posting…') : editingJob ? 'Save changes' : 'Post job'}
              </Button>
              {editingJob && (
                <Button type="button" variant="secondary" onClick={cancelEditing}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold text-navy">Your job openings</h2>
            {jobs.length === 0 ? (
              <p className="mt-2 text-muted">You haven't posted any jobs yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-muted">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3 font-medium text-ink">{job.title}</td>
                        <td className="px-4 py-3 text-muted">{job.location}</td>
                        <td className="px-4 py-3">
                          <Badge variant={job.status === 'OPEN' ? 'success' : 'neutral'}>{job.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => startEditing(job)}
                            className="mr-3 rounded-md border border-line px-3 py-1 text-xs font-medium text-ink hover:border-navy hover:text-navy"
                          >
                            Edit
                          </button>
                          {job.status === 'OPEN' && (
                            <button
                              onClick={() => closeJob(job.id)}
                              className="rounded-md border border-line px-3 py-1 text-xs font-medium text-ink hover:border-navy hover:text-navy"
                            >
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
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

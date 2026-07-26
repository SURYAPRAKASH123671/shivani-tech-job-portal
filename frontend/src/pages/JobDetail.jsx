import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

function formatSalary(min, max) {
  if (!min && !max) return 'Not disclosed'
  if (min && max) return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`
  return `Up to ₹${(max || min).toLocaleString('en-IN')}`
}

export default function JobDetail() {
  const { id } = useParams()
  const { isAuthenticated, role } = useAuth()
  const [job, setJob] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState('idle') // idle | applying | applied | error
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setLoadError(null)
    client
      .get(`/api/jobs/${id}`)
      .then((res) => setJob(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'This job could not be found.'))
  }, [id])

  async function handleApply() {
    setStatus('applying')
    setMessage(null)
    try {
      await client.post(`/api/candidate/jobs/${id}/apply`)
      setStatus('applied')
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Could not submit your application. Try again.')
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-danger">{loadError}</p>
        <Link to="/" className="mt-2 inline-block text-sm text-navy hover:underline">
          ← Back to search
        </Link>
      </div>
    )
  }

  if (!job) {
    return <p className="mx-auto max-w-3xl px-6 py-10 text-muted">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/" className="text-sm text-navy hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4 rounded-lg border border-line bg-surface p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl">{job.title}</h1>
            <p className="mt-1 text-muted">
              {job.companyName || 'Shivani Technologies'} · {job.location}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-amber/15 px-3 py-1 text-xs font-medium text-amber-dark">
            {job.status}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-6 text-sm sm:grid-cols-3">
          <Field label="Category" value={job.category} />
          <Field label="Designation" value={job.designation} />
          <Field label="Qualification" value={job.qualification || '—'} />
          <Field label="Salary" value={formatSalary(job.salaryMin, job.salaryMax)} />
          <Field
            label="Experience"
            value={job.experienceMin || job.experienceMax ? `${job.experienceMin ?? 0}–${job.experienceMax ?? '∞'} yrs` : '—'}
          />
        </dl>

        {job.skills?.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span key={skill} className="rounded-md bg-canvas px-2.5 py-1 text-xs text-ink">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.description && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Description</p>
            <p className="mt-2 whitespace-pre-line text-sm text-ink">{job.description}</p>
          </div>
        )}

        <div className="mt-8">
          {status === 'applied' ? (
            <p className="rounded-md bg-success/10 px-4 py-3 text-sm font-medium text-success">
              Application submitted — good luck!
            </p>
          ) : !isAuthenticated ? (
            <Link
              to="/login"
              className="inline-block rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-light"
            >
              Log in to apply
            </Link>
          ) : role !== 'CANDIDATE' ? (
            <p className="text-sm text-muted">Only candidate accounts can apply to openings.</p>
          ) : (
            <button
              onClick={handleApply}
              disabled={status === 'applying' || job.status !== 'OPEN'}
              className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
            >
              {job.status !== 'OPEN' ? 'This role is closed' : status === 'applying' ? 'Submitting…' : 'Apply now'}
            </button>
          )}
          {message && <p className="mt-2 text-sm text-danger">{message}</p>}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  )
}

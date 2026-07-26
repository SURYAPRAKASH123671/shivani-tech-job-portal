import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Chip from '../components/ui/Chip.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useSavedJobs } from '../lib/savedJobs.js'

function formatSalary(min, max) {
  if (!min && !max) return 'Not disclosed'
  if (min && max) return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`
  return `Up to ₹${(max || min).toLocaleString('en-IN')}`
}

function initials(name) {
  return (name || 'ST')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function JobDetail() {
  const { id } = useParams()
  const { isAuthenticated, role } = useAuth()
  const { isSaved, toggleSaved } = useSavedJobs()
  const [job, setJob] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState('idle') // idle | applying | applied | error
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setLoadError(null)
    setJob(null)
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
        <EmptyState
          title="This job could not be found"
          description={loadError}
          action={
            <Link to="/jobs" className="text-sm font-medium text-navy hover:underline">
              ← Back to search
            </Link>
          }
        />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 rounded-xl border border-line bg-surface p-8">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <Skeleton className="mt-8 h-20 w-full" />
          <Skeleton className="mt-6 h-24 w-full" />
        </div>
      </div>
    )
  }

  const saved = isSaved(job.id)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to="/jobs" className="text-navy hover:underline">
          ← Back to search
        </Link>
      </nav>

      <div className="mt-4 rounded-xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-navy/10 font-display text-lg font-semibold text-navy">
              {initials(job.companyName)}
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-navy">{job.title}</h1>
              <p className="mt-1 text-muted">
                {job.companyName || 'Shivani Technologies'} · {job.location}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant={job.status === 'OPEN' ? 'success' : 'neutral'}>{job.status}</Badge>
            <button
              type="button"
              onClick={() => toggleSaved(job.id)}
              aria-pressed={saved}
              title={saved ? 'Saved on this device' : 'Save on this device'}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
            >
              <svg viewBox="0 0 20 20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={`h-4 w-4 ${saved ? 'text-amber-dark' : ''}`}>
                <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v13l-5-3-5 3v-13Z" strokeLinejoin="round" />
              </svg>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-y border-line py-5">
          <Chip>{job.category}</Chip>
          <Chip>{job.designation}</Chip>
          {job.qualification && <Chip>{job.qualification}</Chip>}
          {(job.experienceMin != null || job.experienceMax != null) && (
            <Chip>
              {job.experienceMin ?? 0}–{job.experienceMax ?? '∞'} yrs experience
            </Chip>
          )}
          <Badge variant="success" className="!bg-success/10 !text-success">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </Badge>
        </div>

        {job.skills?.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          </div>
        )}

        {job.description && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Description</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{job.description}</p>
          </div>
        )}

        <div className="mt-8">
          {status === 'applied' ? (
            <p className="rounded-md bg-success/10 px-4 py-3 text-sm font-medium text-success">
              ✓ Application submitted — good luck!
            </p>
          ) : !isAuthenticated ? (
            <Button as={Link} to="/login" size="lg">
              Log in to apply
            </Button>
          ) : role !== 'CANDIDATE' ? (
            <p className="text-sm text-muted">Only candidate accounts can apply to openings.</p>
          ) : (
            <Button onClick={handleApply} disabled={status === 'applying' || job.status !== 'OPEN'} size="lg">
              {job.status !== 'OPEN' ? 'This role is closed' : status === 'applying' ? 'Submitting…' : 'Apply now'}
            </Button>
          )}
          {message && <p className="mt-2 text-sm text-danger">{message}</p>}
        </div>
      </div>
    </div>
  )
}

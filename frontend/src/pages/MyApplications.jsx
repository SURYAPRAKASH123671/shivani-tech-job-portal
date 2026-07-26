import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'

const statusStyles = {
  APPLIED: 'bg-navy/10 text-navy',
  SHORTLISTED: 'bg-amber/15 text-amber-dark',
  HIRED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
}

export default function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    client
      .get('/api/candidate/applications')
      .then((res) => setApplications(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your applications.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-navy">My applications</h1>
      <p className="mt-2 text-muted">Track every role you've applied to and where it stands.</p>

      <div className="mt-8">
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : applications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-surface p-10 text-center">
            <p className="font-medium text-ink">You haven't applied to anything yet</p>
            <Link to="/jobs" className="mt-2 inline-block text-sm text-navy hover:underline">
              Browse open roles →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line rounded-lg border border-line bg-surface">
            {applications.map((app) => (
              <Link
                key={app.applicationId}
                to={`/jobs/${app.jobId}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-canvas"
              >
                <div>
                  <p className="font-medium text-ink">{app.jobTitle}</p>
                  <p className="text-sm text-muted">{app.companyName || 'Shivani Technologies'}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyles[app.status] || 'bg-canvas text-ink'}`}
                >
                  {app.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

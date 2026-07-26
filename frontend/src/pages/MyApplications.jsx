import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

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
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'My applications' }]} />
      <h1 className="mt-3 font-display text-2xl font-semibold text-navy">My applications</h1>
      <p className="mt-2 text-muted">Track every role you've applied to and where it stands.</p>

      <div className="mt-8">
        {loading ? (
          <div className="divide-y divide-line rounded-xl border border-line bg-surface">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : applications.length === 0 ? (
          <EmptyState
            title="You haven't applied to anything yet"
            description="Once you apply to a role, you'll be able to track its status here."
            action={
              <Link to="/jobs" className="text-sm font-medium text-navy hover:underline">
                Browse open roles →
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-line rounded-xl border border-line bg-surface">
            {applications.map((app) => (
              <Link
                key={app.applicationId}
                to={`/jobs/${app.jobId}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{app.jobTitle}</p>
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

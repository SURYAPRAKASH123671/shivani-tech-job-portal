import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'
import JobCard from '../components/JobCard.jsx'

const statusStyles = {
  APPLIED: 'bg-navy/10 text-navy',
  SHORTLISTED: 'bg-amber/15 text-amber-dark',
  HIRED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
}

export default function CandidateDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    client
      .get('/api/candidate/dashboard')
      .then((res) => setDashboard(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your dashboard.'))
  }, [])

  if (error) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-sm text-danger">{error}</p>
  }

  if (!dashboard) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted">Loading…</p>
  }

  const { welcome, stats, recentApplications, recommendedJobs } = dashboard

  const tiles = [
    { label: 'Total applications', value: stats.totalApplications },
    { label: 'Active applications', value: stats.activeApplications },
    { label: 'Jobs saved', value: stats.jobsSaved },
    { label: 'Interviews scheduled', value: stats.interviewsScheduled },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Welcome card */}
      <div className="rounded-lg border border-line bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Welcome back</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy">{welcome.fullName}</h1>
            <p className="mt-1 text-sm text-muted">{welcome.email}</p>
          </div>
          <div className="w-full sm:w-64">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Profile completion</span>
              <span className="font-medium text-ink">{welcome.profileCompletionPercentage}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-amber transition-all"
                style={{ width: `${welcome.profileCompletionPercentage}%` }}
              />
            </div>
            {welcome.profileCompletionPercentage < 100 && (
              <Link to="/candidate/profile" className="mt-2 inline-block text-xs font-medium text-navy hover:underline">
                Complete your profile →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-line bg-surface p-5">
            <p className="text-3xl font-semibold text-navy">{tile.value}</p>
            <p className="mt-1 text-sm text-muted">{tile.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/candidate/profile" className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light">
          Edit profile
        </Link>
        <Link to="/" className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-navy">
          Browse jobs
        </Link>
        <Link
          to="/applications"
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-navy"
        >
          My applications
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent applications */}
        <div>
          <h2 className="text-lg font-semibold text-navy">Recent applications</h2>
          {recentApplications.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-line bg-surface p-8 text-center">
              <p className="text-sm text-muted">You haven't applied to anything yet.</p>
              <Link to="/" className="mt-2 inline-block text-sm text-navy hover:underline">
                Browse open roles →
              </Link>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
              {recentApplications.map((app) => (
                <Link
                  key={app.applicationId}
                  to={`/jobs/${app.jobId}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-canvas"
                >
                  <div>
                    <p className="font-medium text-ink">{app.jobTitle}</p>
                    <p className="text-sm text-muted">
                      {app.companyName || 'Shivani Technologies'} ·{' '}
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''}
                    </p>
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

        {/* Recommended jobs */}
        <div>
          <h2 className="text-lg font-semibold text-navy">Recommended for you</h2>
          {recommendedJobs.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-line bg-surface p-8 text-center">
              <p className="text-sm text-muted">No open roles right now — check back soon.</p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4">
              {recommendedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

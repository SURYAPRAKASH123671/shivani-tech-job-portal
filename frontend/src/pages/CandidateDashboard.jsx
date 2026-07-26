import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import client from '../api/client.js'
import JobCard from '../components/JobCard.jsx'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import WelcomeHeader from '../components/ui/WelcomeHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import ChartCard from '../components/ui/ChartCard.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { bucketByMonth, groupCount } from '../lib/monthlyBuckets.js'
import { useSavedJobs } from '../lib/savedJobs.js'
import { getRecentlyViewed } from '../lib/recentlyViewed.js'

const statusStyles = {
  APPLIED: 'bg-navy/10 text-navy',
  SHORTLISTED: 'bg-amber/15 text-amber-dark',
  HIRED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
}

const STATUS_COLORS = { APPLIED: '#1B2A4A', SHORTLISTED: '#E8A33D', HIRED: '#1D9E75', REJECTED: '#D64545' }

export default function CandidateDashboard() {
  const { savedIds } = useSavedJobs()
  const [dashboard, setDashboard] = useState(null)
  const [allApplications, setAllApplications] = useState(null)
  const [savedJobs, setSavedJobs] = useState([])
  const [recentlyViewedJobs, setRecentlyViewedJobs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    client
      .get('/api/candidate/dashboard')
      .then((res) => setDashboard(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your dashboard.'))
    client.get('/api/candidate/applications').then((res) => setAllApplications(res.data))
  }, [])

  useEffect(() => {
    const viewedIds = getRecentlyViewed().filter((id) => !savedIds.includes(id)).slice(0, 3)
    Promise.all(savedIds.slice(0, 6).map((id) => client.get(`/api/jobs/${id}`).then((r) => r.data).catch(() => null)))
      .then((jobs) => setSavedJobs(jobs.filter(Boolean)))
    Promise.all(viewedIds.map((id) => client.get(`/api/jobs/${id}`).then((r) => r.data).catch(() => null)))
      .then((jobs) => setRecentlyViewedJobs(jobs.filter(Boolean)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedIds.join(',')])

  const loading = !dashboard || !allApplications
  const statusBreakdown = useMemo(
    () => (allApplications ? groupCount(allApplications, 'status') : []),
    [allApplications],
  )
  const monthlyApplications = useMemo(
    () => (allApplications ? bucketByMonth(allApplications, 'appliedAt') : []),
    [allApplications],
  )

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <EmptyState title="Could not load your dashboard" description={error} />
      </div>
    )
  }

  const { welcome, stats, recommendedJobs } = dashboard || {}
  const submitted = allApplications?.length ?? 0
  const shortlisted = allApplications?.filter((a) => a.status === 'SHORTLISTED').length ?? 0
  const rejected = allApplications?.filter((a) => a.status === 'REJECTED').length ?? 0
  const pending = allApplications?.filter((a) => a.status === 'APPLIED').length ?? 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Candidate', to: '/candidate/dashboard' }, { label: 'Dashboard' }]} />
      <div className="mt-3 rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Welcome back</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-navy">{welcome?.fullName || '…'}</h1>
            <p className="mt-1 text-sm text-muted">{welcome?.email}</p>
          </div>
          <div className="w-full sm:w-64">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Profile completion</span>
              <span className="font-medium text-ink">{welcome?.profileCompletionPercentage ?? 0}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${welcome?.profileCompletionPercentage ?? 0}%` }} />
            </div>
            {welcome && welcome.profileCompletionPercentage < 100 && (
              <Link to="/candidate/profile" className="mt-2 inline-block text-xs font-medium text-navy hover:underline">
                Complete your profile →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="layers" label="Applications submitted" value={submitted} loading={loading} />
        <StatCard icon="checkCircle" label="Shortlisted" value={shortlisted} tone="success" loading={loading} />
        <StatCard icon="xCircle" label="Rejected" value={rejected} tone="danger" loading={loading} />
        <StatCard icon="clock" label="Pending review" value={pending} tone="amber" loading={loading} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button as={Link} to="/candidate/profile" size="sm">
          Edit profile
        </Button>
        <Button as={Link} to="/jobs" variant="secondary" size="sm">
          Browse jobs
        </Button>
        <Button as={Link} to="/applications" variant="secondary" size="sm">
          My applications
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Application status" loading={loading} isEmpty={statusBreakdown.length === 0} emptyMessage="Apply to a job to see your status breakdown here.">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {statusBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly applications" subtitle="Last 6 months" loading={loading} isEmpty={monthlyApplications.every((m) => m.count === 0)} emptyMessage="No applications yet.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyApplications}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip />
              <Bar dataKey="count" name="Applications" fill="#1B2A4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">Recent activity</h2>
          {!allApplications || allApplications.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="You haven't applied to anything yet" action={<Link to="/jobs" className="text-sm text-navy hover:underline">Browse open roles →</Link>} />
            </div>
          ) : (
            <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
              {allApplications.slice(0, 5).map((app) => (
                <Link key={app.applicationId} to={`/jobs/${app.jobId}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-canvas">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{app.jobTitle}</p>
                    <p className="text-sm text-muted">
                      {app.companyName || 'Shivani Technologies'} · {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyles[app.status] || 'bg-canvas text-ink'}`}>
                    {app.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-navy">Recommended for you</h2>
          {loading || recommendedJobs?.length === 0 ? (
            <div className="mt-3">
              <EmptyState title={loading ? 'Loading…' : 'No open roles right now'} description={loading ? undefined : 'Check back soon.'} />
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

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">Saved jobs</h2>
          <p className="text-xs text-muted">Saved on this device - see the heart icon on any job card.</p>
          {savedJobs.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No saved jobs yet" description="Tap the heart icon on any job to save it here." />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4">
              {savedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-navy">Recently viewed</h2>
          <p className="text-xs text-muted">Tracked on this device only.</p>
          {recentlyViewedJobs.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="Nothing viewed yet" description="Jobs you open will show up here." />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4">
              {recentlyViewedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

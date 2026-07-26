import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
import ChartCard from '../components/ui/ChartCard.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { bucketByMonth, groupCount } from '../lib/monthlyBuckets.js'

const COLORS = ['#1B2A4A', '#E8A33D', '#1D9E75', '#2E4374', '#D64545', '#F3C57D']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [jobs, setJobs] = useState(null)
  const [applications, setApplications] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      client.get('/api/admin/dashboard'),
      client.get('/api/admin/jobs'),
      client.get('/api/admin/applications'),
    ])
      .then(([statsRes, jobsRes, appsRes]) => {
        setStats(statsRes.data)
        setJobs(jobsRes.data)
        setApplications(appsRes.data)
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard stats.'))
  }, [])

  const loading = !stats || !jobs || !applications
  const monthlyJobs = useMemo(() => (jobs ? bucketByMonth(jobs, 'createdAt') : []), [jobs])
  const byCategory = useMemo(() => (applications ? groupCount(applications, 'category') : []), [applications])
  const byLocation = useMemo(() => (applications ? groupCount(applications, 'location') : []), [applications])

  const companyStatusData = stats
    ? [
        { name: 'Active', value: stats.activeCompanies },
        { name: 'Pending', value: stats.pendingCompanies },
        { name: 'Rejected', value: stats.rejectedCompanies },
      ].filter((d) => d.value > 0)
    : []

  const userDistributionData = stats
    ? [
        { name: 'Candidates', value: stats.totalCandidates },
        { name: 'Employees', value: stats.totalEmployees },
      ].filter((d) => d.value > 0)
    : []

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <EmptyState title="Could not load dashboard" description={error} />
      </div>
    )
  }

  const tiles = stats && [
    { icon: 'briefcase', label: 'Total jobs', value: stats.openJobs + stats.closedJobs, to: '/admin/jobs' },
    { icon: 'checkCircle', label: 'Active jobs', value: stats.openJobs, tone: 'success', to: '/admin/jobs' },
    { icon: 'building', label: 'Companies', value: stats.activeCompanies + stats.pendingCompanies + stats.rejectedCompanies, to: '/admin/companies' },
    { icon: 'users', label: 'Candidates', value: stats.totalCandidates, tone: 'amber' },
    { icon: 'user', label: 'Employees', value: stats.totalEmployees, to: '/admin/employees' },
    { icon: 'layers', label: 'Applications', value: stats.totalApplications },
    { icon: 'clock', label: 'Pending approvals', value: stats.pendingCompanies, tone: 'amber', to: '/admin/companies' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Dashboard' }]} />
      <div className="mt-3">
        <WelcomeHeader
          eyebrow="Admin"
          title="Platform overview"
          subtitle="A snapshot of everything happening on the platform right now."
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <StatCard key={i} icon="briefcase" label="" value="" loading />)
          : tiles.map((tile) => {
              const card = <StatCard icon={tile.icon} label={tile.label} value={tile.value} tone={tile.tone} />
              return tile.to ? (
                <Link key={tile.label} to={tile.to} className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">
                  {card}
                </Link>
              ) : (
                <div key={tile.label}>{card}</div>
              )
            })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button as={Link} to="/admin/companies" variant="secondary" size="sm">
          Review companies
        </Button>
        <Button as={Link} to="/admin/jobs" variant="secondary" size="sm">
          Manage jobs
        </Button>
        <Button as={Link} to="/admin/lookups" variant="secondary" size="sm">
          Categories &amp; skills
        </Button>
        <Button as={Link} to="/admin/notifications" variant="secondary" size="sm">
          Send notification
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Monthly job posting trend" subtitle="Last 6 months" loading={loading} isEmpty={monthlyJobs.every((m) => m.count === 0)} emptyMessage="No jobs have been posted yet.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyJobs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Jobs posted" stroke="#1B2A4A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Company status distribution" loading={loading} isEmpty={companyStatusData.length === 0} emptyMessage="No companies have registered yet.">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={companyStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {companyStatusData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Applications by category" loading={loading} isEmpty={byCategory.length === 0} emptyMessage="No applications have been submitted yet.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip />
              <Bar dataKey="value" name="Applications" fill="#E8A33D" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Applications by location" loading={loading} isEmpty={byLocation.length === 0} emptyMessage="No applications have been submitted yet.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byLocation} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip />
              <Bar dataKey="value" name="Applications" fill="#1D9E75" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User distribution" loading={loading} isEmpty={userDistributionData.length === 0} emptyMessage="No candidates or employees yet.">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={userDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {userDistributionData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recent notifications" loading={loading} isEmpty emptyMessage="Notification history isn't tracked yet - sends go out immediately and are logged server-side only, not stored for display here.">
          <div />
        </ChartCard>
      </div>
    </div>
  )
}

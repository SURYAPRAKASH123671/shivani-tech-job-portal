import { useEffect, useState } from 'react'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import WelcomeHeader from '../components/ui/WelcomeHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import ChartCard from '../components/ui/ChartCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import client from '../api/client.js'

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    client
      .get('/api/employee/me')
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your profile.'))
  }, [])

  const loading = !profile && !error

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Employee', to: '/employee/dashboard' }, { label: 'Dashboard' }]} />
      <div className="mt-3">
        <WelcomeHeader
          eyebrow="Employee"
          title={loading ? 'Loading…' : error ? 'Dashboard' : profile.fullName}
          subtitle={loading ? undefined : error || profile.designation || 'No designation on file'}
        />
      </div>

      {error && (
        <div className="mt-6">
          <EmptyState title="Could not load your profile" description={error} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="user" label="Account status" value={profile ? (profile.enabled ? 'Active' : 'Disabled') : ''} tone={profile?.enabled ? 'success' : 'danger'} loading={loading} />
        <StatCard icon="clock" label="Member since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'} loading={loading} />
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-line bg-surface p-6">
        <p className="font-display text-sm font-semibold text-navy">About this dashboard</p>
        <p className="mt-1 text-sm text-muted">
          Employee accounts in this system currently have scoped, read-only access and no assigned
          companies, jobs, or recruitment workflow of their own yet - that's a real gap in the
          current feature set, not something hidden. The sections below are shown honestly as
          "not available" rather than filled with placeholder numbers.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <EmptyState title="Assigned companies" description="Employee-to-company assignment isn't implemented in this system yet." />
        <EmptyState title="Assigned jobs" description="Employee-to-job assignment isn't implemented in this system yet." />
        <EmptyState title="Recruitment activity" description="No per-employee recruitment tracking exists yet." />
        <EmptyState title="Today's tasks" description="There's no task-assignment feature yet." />
        <EmptyState title="Recent updates" description="No update feed exists for employee accounts yet." />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Monthly activity" loading={false} isEmpty emptyMessage="No per-employee activity is tracked yet." />
        <ChartCard title="Recruitment statistics" loading={false} isEmpty emptyMessage="No per-employee recruitment statistics are tracked yet." />
      </div>
    </div>
  )
}

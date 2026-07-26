import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await client.get('/api/admin/dashboard')
        setStats(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load dashboard stats.')
      }
    }
    load()
  }, [])

  if (error) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-sm text-danger">{error}</p>
  }

  if (!stats) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted">Loading…</p>
  }

  const tiles = [
    { label: 'Candidates', value: stats.totalCandidates, to: null },
    { label: 'Employees', value: stats.totalEmployees, to: '/admin/employees' },
    { label: 'Companies pending', value: stats.pendingCompanies, to: '/admin/companies' },
    { label: 'Companies active', value: stats.activeCompanies, to: '/admin/companies' },
    { label: 'Companies rejected', value: stats.rejectedCompanies, to: '/admin/companies' },
    { label: 'Open jobs', value: stats.openJobs, to: '/admin/jobs' },
    { label: 'Closed jobs', value: stats.closedJobs, to: '/admin/jobs' },
    { label: 'Jobs posted by admin', value: stats.jobsPostedByAdmin, to: '/admin/jobs' },
    { label: 'Jobs posted by companies', value: stats.jobsPostedByCompanies, to: '/admin/jobs' },
    { label: 'Total applications', value: stats.totalApplications, to: null },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Admin</p>
      <h1 className="mt-2 text-3xl">Dashboard</h1>
      <p className="mt-2 text-muted">A snapshot of everything happening on the platform right now.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => {
          const card = (
            <div className="rounded-lg border border-line bg-surface p-5 hover:border-navy">
              <p className="text-3xl font-semibold text-navy">{tile.value}</p>
              <p className="mt-1 text-sm text-muted">{tile.label}</p>
            </div>
          )
          return tile.to ? (
            <Link key={tile.label} to={tile.to}>
              {card}
            </Link>
          ) : (
            <div key={tile.label}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}

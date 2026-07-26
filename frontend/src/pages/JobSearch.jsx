import { useEffect, useState } from 'react'
import client from '../api/client.js'
import JobCard from '../components/JobCard.jsx'

const emptyFilters = {
  companyId: '',
  categoryId: '',
  designationId: '',
  locationId: '',
  skillId: '',
  minSalary: '',
  maxExperience: '',
  qualification: '',
}

export default function JobSearch() {
  const [lookups, setLookups] = useState({ companies: [], categories: [], designations: [], locations: [], skills: [] })
  const [filters, setFilters] = useState(emptyFilters)
  const [jobs, setJobs] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadLookups() {
      const [companies, categories, designations, locations, skills] = await Promise.all([
        client.get('/api/jobs/companies'),
        client.get('/api/admin/categories'),
        client.get('/api/admin/designations'),
        client.get('/api/admin/locations'),
        client.get('/api/admin/skills'),
      ])
      setLookups({
        companies: companies.data,
        categories: categories.data,
        designations: designations.data,
        locations: locations.data,
        skills: skills.data,
      })
    }
    loadLookups().catch(() => {
      // Lookups are optional decoration for the filter bar - search still works without them
    })
  }, [])

  useEffect(() => {
    runSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runSearch(e, activeFilters = filters) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value !== '' && value !== null),
      )
      const { data } = await client.get('/api/jobs/search', { params: { ...params, size: 20 } })
      setJobs(data.content || [])
      setTotalElements(data.totalElements ?? data.content?.length ?? 0)
    } catch (err) {
      setJobs([])
      setTotalElements(0)
      setError(err.response?.data?.message || 'Could not load job listings. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  function update(field) {
    return (e) => setFilters({ ...filters, [field]: e.target.value })
  }

  function clearFilters() {
    setFilters(emptyFilters)
    runSearch(null, emptyFilters)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Job search</p>
        <h1 className="mt-2 text-3xl">Find your next role</h1>
        <p className="mt-2 text-muted">
          Filter by company, category, location, skill, salary, or experience — every open position,
          in one place.
        </p>
      </div>

      <form
        onSubmit={runSearch}
        className="mt-8 grid grid-cols-1 gap-3 rounded-lg border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Select label="Company" value={filters.companyId} onChange={update('companyId')} options={lookups.companies} />
        <Select label="Category" value={filters.categoryId} onChange={update('categoryId')} options={lookups.categories} />
        <Select
          label="Designation"
          value={filters.designationId}
          onChange={update('designationId')}
          options={lookups.designations}
        />
        <Select label="Location" value={filters.locationId} onChange={update('locationId')} options={lookups.locations} />
        <Select label="Skill" value={filters.skillId} onChange={update('skillId')} options={lookups.skills} />

        <div>
          <label className="block text-xs font-medium text-muted">Min salary (₹)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={filters.minSalary}
            onChange={update('minSalary')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Max experience (yrs)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={filters.maxExperience}
            onChange={update('maxExperience')}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted">Qualification</label>
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            placeholder="e.g. B.Tech"
            value={filters.qualification}
            onChange={update('qualification')}
          />
        </div>

        <div className="flex items-end gap-2 lg:col-span-4">
          <button type="submit" className="rounded-md bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-light">
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-line px-5 py-2 text-sm font-medium text-ink hover:border-navy"
          >
            Clear filters
          </button>
        </div>
      </form>

      <div className="mt-8">
        {loading ? (
          <p className="text-muted">Loading openings…</p>
        ) : error ? (
          <div className="rounded-lg border border-dashed border-danger/40 bg-surface p-10 text-center">
            <p className="font-medium text-danger">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-surface p-10 text-center">
            <p className="font-medium text-ink">No openings match those filters yet</p>
            <p className="mt-1 text-sm text-muted">Try clearing a filter or checking back soon.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">{totalElements} open position{totalElements === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted">{label}</label>
      <select
        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
        value={value}
        onChange={onChange}
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  )
}

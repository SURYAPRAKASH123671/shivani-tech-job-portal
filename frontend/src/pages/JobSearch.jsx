import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import client from '../api/client.js'
import JobCard from '../components/JobCard.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'

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

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'salaryMax,desc', label: 'Salary: high to low' },
  { value: 'salaryMin,asc', label: 'Salary: low to high' },
  { value: 'experienceMin,asc', label: 'Experience: low to high' },
]

function filtersFromUrl(searchParams) {
  const fromUrl = { ...emptyFilters }
  for (const key of Object.keys(emptyFilters)) {
    const value = searchParams.get(key)
    if (value) fromUrl[key] = value
  }
  return fromUrl
}

export default function JobSearch() {
  const [searchParams] = useSearchParams()
  const [lookups, setLookups] = useState({ companies: [], categories: [], designations: [], locations: [], skills: [] })
  const [filters, setFilters] = useState(() => filtersFromUrl(searchParams))
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(0)
  const [jobs, setJobs] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerCloseRef = useRef(null)

  useEffect(() => {
    if (!drawerOpen) return
    drawerCloseRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

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

  async function runSearch(e, activeFilters = filters, targetPage = 0, activeSort = sort) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value !== '' && value !== null),
      )
      params.page = targetPage
      params.size = 9
      if (activeSort) params.sort = activeSort
      const { data } = await client.get('/api/jobs/search', { params })
      setJobs(data.content || [])
      setTotalElements(data.totalElements ?? data.content?.length ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setPage(targetPage)
      setDrawerOpen(false)
    } catch (err) {
      setJobs([])
      setTotalElements(0)
      setTotalPages(0)
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
    runSearch(null, emptyFilters, 0, sort)
  }

  function removeFilter(field) {
    const next = { ...filters, [field]: '' }
    setFilters(next)
    runSearch(null, next, 0, sort)
  }

  function changeSort(e) {
    const value = e.target.value
    setSort(value)
    runSearch(null, filters, 0, value)
  }

  const activeFilterChips = Object.entries(filters)
    .filter(([, value]) => value !== '')
    .map(([field, value]) => ({ field, label: describeFilter(field, value, lookups) }))

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Job search</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-navy">Find your next role</h1>
        <p className="mt-2 text-muted">
          Filter by company, category, location, skill, salary, or experience — every open position,
          in one place.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 lg:hidden">
        <Button variant="secondary" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog">
          Filters {activeFilterChips.length > 0 && `(${activeFilterChips.length})`}
        </Button>
        <SortSelect value={sort} onChange={changeSort} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterForm
              filters={filters}
              update={update}
              lookups={lookups}
              onSubmit={(e) => runSearch(e, filters, 0, sort)}
              onClear={clearFilters}
            />
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter jobs">
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-ink/40"
            />
            <div className="absolute inset-y-0 right-0 w-full max-w-xs overflow-y-auto bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-navy">Filters</h2>
                <button
                  ref={drawerCloseRef}
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close"
                  className="rounded-md p-1 text-muted hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4">
                <FilterForm
                  filters={filters}
                  update={update}
                  lookups={lookups}
                  onSubmit={(e) => runSearch(e, filters, 0, sort)}
                  onClear={clearFilters}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <div className="hidden items-center justify-between lg:flex">
            <p className="text-sm text-muted">
              {loading ? 'Searching…' : `${totalElements} open position${totalElements === 1 ? '' : 's'}`}
            </p>
            <SortSelect value={sort} onChange={changeSort} />
          </div>

          {activeFilterChips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 lg:mt-3">
              {activeFilterChips.map(({ field, label }) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => removeFilter(field)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 text-xs font-medium text-navy hover:bg-navy/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
                  aria-label={`Remove filter: ${label}`}
                >
                  {label}
                  <span aria-hidden="true">✕</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-muted hover:text-danger hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="mt-5 lg:mt-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : error ? (
              <EmptyState title="Something went wrong" description={error} />
            ) : jobs.length === 0 ? (
              <EmptyState
                title="No openings match those filters yet"
                description="Try clearing a filter or checking back soon."
                action={
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <Pagination page={page} totalPages={totalPages} onChange={(n) => runSearch(null, filters, n, sort)} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SortSelect({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="sr-only sm:not-sr-only">Sort by</span>
      <select
        value={value}
        onChange={onChange}
        className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FilterForm({ filters, update, lookups, onSubmit, onClear }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-line bg-surface p-5">
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
      <div>
        <label className="block text-xs font-medium text-muted">Qualification</label>
        <input
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
          placeholder="e.g. B.Tech"
          value={filters.qualification}
          onChange={update('qualification')}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">
          Search
        </Button>
        <Button type="button" variant="secondary" onClick={onClear}>
          Clear
        </Button>
      </div>
    </form>
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

function describeFilter(field, value, lookups) {
  const lookupMap = {
    companyId: lookups.companies,
    categoryId: lookups.categories,
    designationId: lookups.designations,
    locationId: lookups.locations,
    skillId: lookups.skills,
  }
  if (lookupMap[field]) {
    const match = lookupMap[field].find((o) => o.id === value)
    return match?.name || value
  }
  const prefixes = { minSalary: 'Min ₹', maxExperience: 'Max ', qualification: '' }
  const suffixes = { maxExperience: ' yrs' }
  return `${prefixes[field] ?? ''}${value}${suffixes[field] ?? ''}`
}

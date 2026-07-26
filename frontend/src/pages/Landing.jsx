import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client.js'
import JobCard from '../components/JobCard.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Chip from '../components/ui/Chip.jsx'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'

const VALUE_PROPS = [
  {
    title: 'One search, every source',
    body: 'Filter by company, category, location, skill, salary, or experience - no more checking five different job boards.',
  },
  {
    title: 'Verified employers only',
    body: "Every company on the platform is reviewed by an administrator before they can post - what you see is a real, vetted opening.",
  },
  {
    title: 'Track everything in one place',
    body: 'Your applications, profile completeness, and recommended roles live on one dashboard, not scattered across email threads.',
  },
]

const PROCESS_STEPS = [
  { step: '1', title: 'Create your profile', body: 'Register and verify your email in under a minute.' },
  { step: '2', title: 'Search & filter', body: 'Narrow thousands of openings down to the ones that fit.' },
  { step: '3', title: 'Apply directly', body: 'One click to apply - no forms to refill, no attachments to hunt for.' },
  { step: '4', title: 'Track your status', body: 'Follow every application from your candidate dashboard.' },
]

const TESTIMONIALS = [
  {
    quote: 'I filtered by skill and location and had three real interviews lined up within a week.',
    name: 'Priya S.',
    role: 'Backend Engineer',
  },
  {
    quote: 'As a hiring manager, the verification step means I never have to wonder if a listing is legitimate.',
    name: 'Arjun M.',
    role: 'Engineering Manager',
  },
  {
    quote: "The dashboard makes it obvious what's left to finish on my profile before I apply.",
    name: 'Fatima K.',
    role: 'Product Designer',
  },
]

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Landing() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [companies, setCompanies] = useState([])
  const [featuredJobs, setFeaturedJobs] = useState([])
  const [totalOpenJobs, setTotalOpenJobs] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [categoriesRes, companiesRes, jobsRes] = await Promise.all([
          client.get('/api/admin/categories'),
          client.get('/api/jobs/companies'),
          client.get('/api/jobs/search', { params: { size: 6 } }),
        ])
        setCategories(categoriesRes.data)
        setCompanies(companiesRes.data)
        setFeaturedJobs(jobsRes.data.content || [])
        setTotalOpenJobs(jobsRes.data.totalElements ?? jobsRes.data.content?.length ?? 0)
      } catch {
        // Landing page degrades gracefully - hero/CTA/static sections still work without live data
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function runHeroSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('qualification', keyword.trim())
    if (categoryId) params.set('categoryId', categoryId)
    navigate(`/jobs${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-amber-light">
            Shivani Technologies Job Portal
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">
            Find your next role, on your terms.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
            Every open position from verified companies, searchable by company, category, location,
            skill, salary, and experience - all in one place.
          </p>

          <form
            onSubmit={runHeroSearch}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-xl bg-white p-3 shadow-lg sm:flex-row"
          >
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Job title or qualification, e.g. B.Tech"
              className="flex-1 rounded-lg border-0 px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-navy/20"
              aria-label="Job title or qualification"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-navy/20 sm:w-48"
              aria-label="Category"
            >
              <option value="">Any category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit" size="lg" className="sm:w-auto">
              Search jobs
            </Button>
          </form>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-white">
            <Stat value={totalOpenJobs} label="Open positions" loading={loading} />
            <Stat value={companies.length} label="Companies hiring" loading={loading} />
            <Stat value={categories.length} label="Job categories" loading={loading} />
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Featured</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-navy">Latest openings</h2>
          </div>
          <Link to="/jobs" className="text-sm font-medium text-navy hover:underline">
            View all jobs →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : featuredJobs.length === 0 ? (
            <p className="col-span-full text-sm text-muted">No open positions right now - check back soon.</p>
          ) : (
            featuredJobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Browse</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-navy">Popular categories</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((c) => (
                <Link key={c.id} to={`/jobs?categoryId=${c.id}`}>
                  <Chip className="px-4 py-2 text-sm hover:border-navy hover:text-navy">{c.name}</Chip>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured companies */}
      {companies.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Employers</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-navy">Companies hiring now</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {companies.map((c) => (
              <Link key={c.id} to={`/jobs?companyId=${c.id}`}>
                <Card hoverable className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/10 font-display text-sm font-semibold text-navy">
                    {initials(c.name)}
                  </span>
                  <span className="truncate text-sm font-medium text-ink">{c.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why choose us */}
      <section className="bg-canvas py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Why this platform</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-navy">Built for a real hiring pipeline</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {VALUE_PROPS.map((v) => (
              <Card key={v.title} className="p-6">
                <h3 className="font-display text-base font-semibold text-navy">{v.title}</h3>
                <p className="mt-2 text-sm text-muted">{v.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process timeline */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">How it works</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-navy">From search to hired</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((s) => (
            <div key={s.step} className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-display text-sm font-semibold text-white">
                {s.step}
              </span>
              <h3 className="mt-3 font-display text-sm font-semibold text-navy">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Testimonials</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-navy">What people are saying</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="p-6">
                <p className="text-sm italic text-ink">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-navy">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Create a candidate profile to start applying, or register your company to start hiring.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button as={Link} to="/register/candidate" variant="amber" size="lg">
              Create your profile
            </Button>
            <Button as={Link} to="/register/company" variant="secondary" size="lg" className="bg-transparent text-white hover:bg-white/10">
              Post a job opening
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Stat({ value, label, loading }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold sm:text-3xl">{loading ? '—' : value ?? 0}</p>
      <p className="mt-1 text-xs text-white/70 sm:text-sm">{label}</p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <p className="font-display text-sm font-semibold text-navy">Shivani Technologies</p>
            <p className="mt-2 text-sm text-muted">A full-stack recruitment platform for candidates, employers, and admins.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">For candidates</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/jobs" className="text-ink hover:text-navy">Search jobs</Link></li>
              <li><Link to="/register/candidate" className="text-ink hover:text-navy">Create profile</Link></li>
              <li><Link to="/login" className="text-ink hover:text-navy">Log in</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">For employers</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/register/company" className="text-ink hover:text-navy">Register your company</Link></li>
              <li><Link to="/login" className="text-ink hover:text-navy">Employer login</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Shivani Technologies</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-line pt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} Shivani Technologies. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

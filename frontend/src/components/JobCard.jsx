import { Link } from 'react-router-dom'
import Badge from './ui/Badge.jsx'
import Chip from './ui/Chip.jsx'
import { useSavedJobs } from '../lib/savedJobs.js'

function formatSalary(min, max) {
  if (!min && !max) return null
  if (min && max) return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`
  return `Up to ₹${(max || min).toLocaleString('en-IN')}`
}

function formatExperience(min, max) {
  if (min == null && max == null) return null
  if (min != null && max != null) return `${min}–${max} yrs`
  return `${min ?? max}+ yrs`
}

function initials(name) {
  return (name || 'ST')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function JobCard({ job }) {
  const { isSaved, toggleSaved } = useSavedJobs()
  const salary = formatSalary(job.salaryMin, job.salaryMax)
  const experience = formatExperience(job.experienceMin, job.experienceMax)
  const saved = isSaved(job.id)

  return (
    <div className="group relative rounded-xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          toggleSaved(job.id)
        }}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
        title={saved ? 'Saved on this device' : 'Save on this device'}
        className="absolute right-4 top-4 rounded-full p-1.5 text-muted transition hover:bg-canvas hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
      >
        <svg viewBox="0 0 20 20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={`h-5 w-5 ${saved ? 'text-amber-dark' : ''}`}>
          <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v13l-5-3-5 3v-13Z" strokeLinejoin="round" />
        </svg>
      </button>

      <Link to={`/jobs/${job.id}`} className="block pr-8">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/10 font-display text-sm font-semibold text-navy">
            {initials(job.companyName)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-navy group-hover:underline">
              {job.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted">{job.companyName || 'Shivani Technologies'}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {job.location && <Chip>📍 {job.location}</Chip>}
          {experience && <Chip>{experience}</Chip>}
          {job.designation && <Badge variant="navy">{job.designation}</Badge>}
        </div>

        {job.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="rounded-md bg-canvas px-2 py-1 text-xs text-muted">
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && <span className="rounded-md px-2 py-1 text-xs text-muted">+{job.skills.length - 4}</span>}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
          <span className="text-muted">{job.category}</span>
          {salary && <span className="font-semibold text-success">{salary}</span>}
        </div>
      </Link>
    </div>
  )
}

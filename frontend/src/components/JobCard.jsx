import { Link } from 'react-router-dom'

function formatSalary(min, max) {
  if (!min && !max) return null
  if (min && max) return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`
  return `Up to ₹${(max || min).toLocaleString('en-IN')}`
}

export default function JobCard({ job }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax)

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block rounded-lg border border-line bg-surface p-5 transition hover:border-navy hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-navy">{job.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {job.companyName || 'Shivani Technologies'} · {job.location}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber/15 px-3 py-1 text-xs font-medium text-amber-dark">
          {job.designation}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.skills?.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-md bg-canvas px-2.5 py-1 text-xs text-ink">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>{job.category}</span>
        {salary && <span className="font-medium text-ink">{salary}</span>}
      </div>
    </Link>
  )
}

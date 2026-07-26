export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy md:flex md:flex-col md:justify-between md:p-12">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle, #E8A33D 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <p className="font-display text-lg font-semibold text-white">
            Shivani <span className="text-amber">Technologies</span>
          </p>
        </div>
        <div className="relative max-w-sm">
          <p className="font-display text-2xl font-semibold leading-snug text-white">
            Every open role in one search — by company, skill, location, or salary.
          </p>
          <p className="mt-4 text-sm text-white/60">
            Candidates, employers, and recruiters — one portal for the whole hiring pipeline.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">{eyebrow}</p>
          <h1 className="mt-2 text-2xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** Numbered pagination with ellipsis for large page counts. `page` is 0-indexed (matches Spring's Pageable). */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="Previous page"
        className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Prev
      </button>

      {pageNumbers.map((n, i) =>
        n === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`min-w-[2.25rem] rounded-md px-3 py-1.5 text-sm font-medium ${
              n === page ? 'bg-navy text-white' : 'text-ink hover:bg-canvas'
            }`}
          >
            {n + 1}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="Next page"
        className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </nav>
  )
}

function getPageNumbers(page, totalPages) {
  const delta = 1
  const range = []
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || (i >= page - delta && i <= page + delta)) {
      range.push(i)
    }
  }
  const withEllipsis = []
  let prev
  for (const n of range) {
    if (prev !== undefined && n - prev > 1) withEllipsis.push('…')
    withEllipsis.push(n)
    prev = n
  }
  return withEllipsis
}

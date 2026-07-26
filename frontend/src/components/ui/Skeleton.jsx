/** Loading placeholder - use instead of "Loading…" text where a shape hints at the real content. */
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-line/70 ${className}`} aria-hidden="true" />
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/3" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="mt-4 h-3 w-1/2" />
    </div>
  )
}

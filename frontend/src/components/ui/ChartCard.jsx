import Card from './Card.jsx'
import Skeleton from './Skeleton.jsx'
import EmptyState from './EmptyState.jsx'

/**
 * Wraps a Recharts chart with a consistent title, loading skeleton, and an honest empty state -
 * so no page has to duplicate the "what if there's no data yet" logic, and no chart ever renders
 * with fabricated placeholder data.
 */
export default function ChartCard({ title, subtitle, loading, isEmpty, emptyMessage, height = 260, children }) {
  return (
    <Card className="p-5">
      <p className="font-display text-sm font-semibold text-navy">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      <div className="mt-4" style={{ height }}>
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState title="Not enough data yet" description={emptyMessage} />
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  )
}

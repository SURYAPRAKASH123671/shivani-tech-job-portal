import Icon from './icons.jsx'
import Skeleton from './Skeleton.jsx'
import Card from './Card.jsx'

const tones = {
  navy: 'bg-navy/10 text-navy',
  amber: 'bg-amber/15 text-amber-dark',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
}

export default function StatCard({ icon, label, value, tone = 'navy', loading = false }) {
  return (
    <Card hoverable className="p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone] || tones.navy}`}>
          <Icon name={icon} />
        </span>
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="font-display text-2xl font-semibold text-ink">{value}</p>
          )}
          <p className="truncate text-xs text-muted">{label}</p>
        </div>
      </div>
    </Card>
  )
}

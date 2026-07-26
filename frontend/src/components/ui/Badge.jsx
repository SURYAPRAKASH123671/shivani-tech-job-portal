const variants = {
  neutral: 'bg-canvas text-ink',
  navy: 'bg-navy/10 text-navy',
  amber: 'bg-amber/15 text-amber-dark',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
}

export default function Badge({ variant = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        variants[variant] || variants.neutral
      } ${className}`}
    >
      {children}
    </span>
  )
}

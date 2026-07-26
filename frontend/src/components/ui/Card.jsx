export default function Card({ as: Component = 'div', className = '', hoverable = false, ...props }) {
  return (
    <Component
      className={`rounded-xl border border-line bg-surface shadow-sm ${
        hoverable ? 'transition hover:-translate-y-0.5 hover:shadow-md' : ''
      } ${className}`}
      {...props}
    />
  )
}

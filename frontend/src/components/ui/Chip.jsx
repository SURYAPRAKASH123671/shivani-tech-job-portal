/** Small tag for skills/categories - visually lighter than Badge, used in lists/cards. */
export default function Chip({ className = '', children, ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

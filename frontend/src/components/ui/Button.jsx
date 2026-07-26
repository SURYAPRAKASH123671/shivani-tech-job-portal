import { forwardRef } from 'react'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const variants = {
  primary: 'bg-navy text-white shadow-sm hover:bg-navy-light active:bg-navy-dark',
  secondary: 'border border-line bg-surface text-ink hover:border-navy hover:text-navy',
  ghost: 'text-ink hover:bg-canvas',
  danger: 'border border-danger/30 text-danger hover:bg-danger/5',
  amber: 'bg-amber text-navy-dark shadow-sm hover:bg-amber-dark hover:text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-base',
}

/**
 * Shared button primitive so every page uses the same set of visual states
 * (hover/active/focus/disabled) instead of ad-hoc className strings.
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', as: Component = 'button', ...props },
  ref,
) {
  const classes = `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`
  return <Component ref={ref} className={classes} {...props} />
})

export default Button

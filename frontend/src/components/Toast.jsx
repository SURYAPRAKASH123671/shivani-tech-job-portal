import { useEffect } from 'react'

const variants = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
}

/**
 * Self-contained toast — render conditionally from the page that owns the
 * message state (e.g. `{toast && <Toast .../>}`), no app-wide provider needed.
 */
export default function Toast({ message, type = 'success', onDismiss, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onDismiss])

  if (!message) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${variants[type] || variants.success}`}>
        <span className="flex-1">{message}</span>
        <button onClick={onDismiss} className="font-medium opacity-70 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  )
}

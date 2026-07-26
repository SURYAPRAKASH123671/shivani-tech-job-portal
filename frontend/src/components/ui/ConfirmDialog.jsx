import { useEffect, useRef } from 'react'
import Button from './Button.jsx'

/**
 * Replaces window.confirm() with a real modal - focus moves to the confirm button on open,
 * Escape closes it, and a backdrop click cancels. Used for anything destructive or state-changing
 * (delete, verify/reject company, disable/enable employee) that previously fired immediately with
 * no confirmation step at all.
 */
export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', tone = 'danger', busy, onConfirm, onCancel }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <button type="button" aria-label="Cancel" onClick={onCancel} className="absolute inset-0 bg-ink/40" />
      <div className="relative w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-xl">
        <h2 id="confirm-dialog-title" className="font-display text-base font-semibold text-navy">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={busy}
            className={tone === 'danger' ? '!bg-danger hover:!bg-danger/90' : ''}
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

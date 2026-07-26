import { useEffect, useMemo, useState } from 'react'
import client from '../api/client.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import WelcomeHeader from '../components/ui/WelcomeHeader.jsx'
import Button from '../components/ui/Button.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Toast from '../components/Toast.jsx'

const AUDIENCES = [
  { value: 'CANDIDATE', label: 'Candidates' },
  { value: 'EMPLOYEE', label: 'Employees' },
  { value: 'COMPANY', label: 'Companies' },
]

export default function AdminNotifications() {
  const [channel, setChannel] = useState('mail') // 'mail' | 'sms'
  const [audience, setAudience] = useState('CANDIDATE')
  const [recipientMode, setRecipientMode] = useState('all')
  const [recipients, setRecipients] = useState([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([])
  const [loadingRecipients, setLoadingRecipients] = useState(true)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function loadRecipients() {
      setLoadingRecipients(true)
      setSelectedRecipientIds([])
      try {
        const { data } = await client.get('/api/admin/notifications/recipients', { params: { audience } })
        setRecipients(data)
      } catch (err) {
        setRecipients([])
        setError(err.response?.data?.message || 'Could not load recipients.')
      } finally {
        setLoadingRecipients(false)
      }
    }
    loadRecipients()
  }, [audience])

  function toggleRecipient(id) {
    setSelectedRecipientIds((selected) =>
      selected.includes(id) ? selected.filter((selectedId) => selectedId !== id) : [...selected, id],
    )
  }

  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase()
    if (!q) return recipients
    return recipients.filter((r) => r.name.toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q))
  }, [recipients, recipientSearch])

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (recipientMode === 'selected' && selectedRecipientIds.length === 0) {
      setError('Choose at least one recipient or switch to everyone.')
      return
    }
    setSending(true)
    try {
      const recipientIds = recipientMode === 'selected' ? selectedRecipientIds : undefined
      if (channel === 'mail') {
        const { data } = await client.post('/api/admin/notifications/mail', { audience, recipientIds, subject, body })
        setResult(data)
      } else {
        const { data } = await client.post('/api/admin/notifications/sms', { audience, recipientIds, message: body })
        setResult(data)
      }
      setToast({ type: 'success', message: `${channel === 'mail' ? 'Email' : 'SMS'} sent.` })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send that.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Mail & SMS' }]} />
      <div className="mt-3">
        <WelcomeHeader
          eyebrow="Admin"
          title="Send mail & SMS"
          subtitle="Broadcast to every candidate, employee, or company on file. Nothing is delivered for real until a mail/SMS provider is configured on the backend - until then, sends are logged instead."
        />
      </div>

      <div className="mt-6 flex gap-2">
        {[
          ['mail', 'Email'],
          ['sms', 'SMS'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setChannel(value)}
            className={`rounded-md border px-4 py-1.5 text-sm font-medium ${
              channel === value ? 'border-navy bg-navy text-white' : 'border-line text-ink hover:border-navy'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-line bg-surface p-6">
        <div>
          <label className="block text-sm font-medium text-ink">Send to</label>
          <select
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-ink">Recipients</legend>
          <div className="mt-2 flex gap-4 text-sm text-ink">
            <label className="flex items-center gap-2">
              <input type="radio" checked={recipientMode === 'all'} onChange={() => setRecipientMode('all')} />
              Everyone
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={recipientMode === 'selected'} onChange={() => setRecipientMode('selected')} />
              Choose recipients
            </label>
          </div>

          {recipientMode === 'selected' && (
            <div className="mt-3">
              <SearchInput value={recipientSearch} onChange={setRecipientSearch} placeholder="Search recipients…" />
              <div className="mt-2 max-h-56 divide-y divide-line overflow-y-auto rounded-md border border-line">
                {loadingRecipients ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-2/3" />
                    ))}
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="p-3">
                    <EmptyState title={recipientSearch ? 'No matches' : 'No recipients are available yet'} />
                  </div>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <label key={recipient.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-canvas">
                      <input
                        type="checkbox"
                        checked={selectedRecipientIds.includes(recipient.id)}
                        onChange={() => toggleRecipient(recipient.id)}
                      />
                      <span>
                        <span className="font-medium text-ink">{recipient.name}</span>
                        <span className="ml-2 text-muted">{recipient.email || recipient.phone || 'No contact details'}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedRecipientIds.length > 0 && (
                <p className="mt-1 text-xs text-muted">{selectedRecipientIds.length} selected</p>
              )}
            </div>
          )}
        </fieldset>

        {channel === 'mail' && (
          <div>
            <label className="block text-sm font-medium text-ink">
              Subject <span className="text-danger">*</span>
            </label>
            <input
              required
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink">
            {channel === 'mail' ? 'Message body' : 'SMS text'} <span className="text-danger">*</span>
          </label>
          <textarea
            required
            rows={5}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={sending}>
          {sending ? 'Sending…' : `Send ${channel === 'mail' ? 'email' : 'SMS'}`}
        </Button>
      </form>

      {result && (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5 text-sm">
          <p className="font-display font-medium text-ink">Result</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>Attempted: {result.attempted}</li>
            <li>Sent: {result.sent}</li>
            <li>Failed: {result.failed}</li>
            <li>Skipped (no contact info): {result.skippedNoContact}</li>
          </ul>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

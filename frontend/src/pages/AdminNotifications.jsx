import { useEffect, useState } from 'react'
import client from '../api/client.js'

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
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([])
  const [loadingRecipients, setLoadingRecipients] = useState(true)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

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
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send that.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Admin</p>
      <h1 className="mt-2 text-3xl">Send mail &amp; SMS</h1>
      <p className="mt-2 text-muted">
        Broadcast to every candidate, employee, or company on file. Nothing is delivered for real
        until a mail/SMS provider is configured on the backend (MAIL_* / TWILIO_* env vars) —
        until then, sends are logged instead.
      </p>

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

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-6">
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
            <div className="mt-3 max-h-56 divide-y divide-line overflow-y-auto rounded-md border border-line">
              {loadingRecipients ? (
                <p className="px-3 py-3 text-sm text-muted">Loading recipients…</p>
              ) : recipients.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted">No recipients are available yet.</p>
              ) : (
                recipients.map((recipient) => (
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
          )}
        </fieldset>

        {channel === 'mail' && (
          <div>
            <label className="block text-sm font-medium text-ink">Subject</label>
            <input
              required
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink">{channel === 'mail' ? 'Message body' : 'SMS text'}</label>
          <textarea
            required
            rows={5}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
        >
          {sending ? 'Sending…' : `Send ${channel === 'mail' ? 'email' : 'SMS'}`}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-lg border border-line bg-surface p-5 text-sm">
          <p className="font-medium text-ink">Result</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>Attempted: {result.attempted}</li>
            <li>Sent: {result.sent}</li>
            <li>Failed: {result.failed}</li>
            <li>Skipped (no contact info): {result.skippedNoContact}</li>
          </ul>
        </div>
      )}
    </div>
  )
}

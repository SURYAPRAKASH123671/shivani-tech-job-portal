import { useEffect, useMemo, useState } from 'react'
import client from '../api/client.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import WelcomeHeader from '../components/ui/WelcomeHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Toast from '../components/Toast.jsx'

const SECTIONS = [
  { key: 'categories', label: 'Job categories', path: '/api/admin/categories' },
  { key: 'designations', label: 'Job designations', path: '/api/admin/designations' },
  { key: 'locations', label: 'Job locations', path: '/api/admin/locations' },
  { key: 'skills', label: 'Skills', path: '/api/admin/skills' },
]

export default function AdminLookups() {
  const [data, setData] = useState({ categories: [], designations: [], locations: [], skills: [] })
  const [drafts, setDrafts] = useState({ categories: '', designations: '', locations: '', skills: '' })
  const [search, setSearch] = useState({ categories: '', designations: '', locations: '', skills: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyKey, setBusyKey] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null) // { section, item }

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(SECTIONS.map((s) => client.get(s.path)))
      const next = {}
      SECTIONS.forEach((s, i) => {
        next[s.key] = results[i].data
      })
      setData(next)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load lookup data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function addItem(section) {
    const name = drafts[section.key].trim()
    if (!name) return
    setBusyKey(section.key)
    setError(null)
    try {
      await client.post(section.path, { name })
      setDrafts({ ...drafts, [section.key]: '' })
      setToast({ type: 'success', message: `Added "${name}".` })
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.message || `Could not add that ${section.label.toLowerCase()}.`)
    } finally {
      setBusyKey(null)
    }
  }

  async function confirmDelete() {
    const { section, item } = confirmTarget
    setBusyKey(section.key)
    try {
      await client.delete(`${section.path}/${item.id}`)
      setToast({ type: 'success', message: `Deleted "${item.name}".` })
      await loadAll()
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not delete that item.' })
    } finally {
      setBusyKey(null)
      setConfirmTarget(null)
    }
  }

  const filteredData = useMemo(() => {
    const result = {}
    for (const section of SECTIONS) {
      const q = search[section.key].trim().toLowerCase()
      result[section.key] = q ? data[section.key].filter((i) => i.name.toLowerCase().includes(q)) : data[section.key]
    }
    return result
  }, [data, search])

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Categories & skills' }]} />
      <div className="mt-3">
        <WelcomeHeader
          eyebrow="Admin"
          title="Job categories, designations, locations & skills"
          subtitle="These are the building blocks used when posting a job - create them here first."
        />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.key} className="p-5">
            <h2 className="font-display text-lg font-semibold text-navy">{section.label}</h2>

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                addItem(section)
              }}
            >
              <input
                className="flex-1 rounded-md border border-line px-3 py-2 text-sm focus:border-navy focus:outline-none"
                placeholder={`New ${section.label.toLowerCase().replace(/s$/, '')}`}
                value={drafts[section.key]}
                onChange={(e) => setDrafts({ ...drafts, [section.key]: e.target.value })}
              />
              <Button type="submit" size="sm" disabled={busyKey === section.key}>
                Add
              </Button>
            </form>

            {data[section.key].length > 3 && (
              <SearchInput
                value={search[section.key]}
                onChange={(v) => setSearch({ ...search, [section.key]: v })}
                placeholder={`Search ${section.label.toLowerCase()}…`}
                className="mt-3"
              />
            )}

            <ul className="mt-4 max-h-64 divide-y divide-line overflow-y-auto">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="py-2">
                    <Skeleton className="h-4 w-2/3" />
                  </li>
                ))
              ) : filteredData[section.key].length === 0 ? (
                <li className="py-2">
                  <EmptyState title={search[section.key] ? 'No matches' : 'None yet'} />
                </li>
              ) : (
                filteredData[section.key].map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink">{item.name}</span>
                    <button
                      disabled={busyKey === section.key}
                      onClick={() => setConfirmTarget({ section, item })}
                      className="text-xs font-medium text-danger hover:underline disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </li>
                ))
              )}
            </ul>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title={`Delete "${confirmTarget?.item.name}"?`}
        description="If this is still referenced by a job or candidate preference, deletion will be blocked rather than breaking anything - you'll see an error instead."
        confirmLabel="Delete"
        tone="danger"
        busy={busyKey === confirmTarget?.section.key}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

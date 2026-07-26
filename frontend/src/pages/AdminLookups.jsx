import { useEffect, useState } from 'react'
import client from '../api/client.js'

const SECTIONS = [
  { key: 'categories', label: 'Job categories', path: '/api/admin/categories' },
  { key: 'designations', label: 'Job designations', path: '/api/admin/designations' },
  { key: 'locations', label: 'Job locations', path: '/api/admin/locations' },
  { key: 'skills', label: 'Skills', path: '/api/admin/skills' },
]

export default function AdminLookups() {
  const [data, setData] = useState({ categories: [], designations: [], locations: [], skills: [] })
  const [drafts, setDrafts] = useState({ categories: '', designations: '', locations: '', skills: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyKey, setBusyKey] = useState(null)

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
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.message || `Could not add that ${section.label.toLowerCase()}.`)
    } finally {
      setBusyKey(null)
    }
  }

  async function deleteItem(section, id) {
    setBusyKey(section.key)
    setError(null)
    try {
      await client.delete(`${section.path}/${id}`)
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete that item.')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Admin</p>
      <h1 className="mt-2 text-3xl">Job categories, designations, locations &amp; skills</h1>
      <p className="mt-2 text-muted">
        These are the building blocks used when posting a job — create them here first.
      </p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold text-navy">{section.label}</h2>

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
              <button
                type="submit"
                disabled={busyKey === section.key}
                className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
              >
                Add
              </button>
            </form>

            <ul className="mt-4 divide-y divide-line">
              {loading ? (
                <li className="py-2 text-sm text-muted">Loading…</li>
              ) : data[section.key].length === 0 ? (
                <li className="py-2 text-sm text-muted">None yet.</li>
              ) : (
                data[section.key].map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink">{item.name}</span>
                    <button
                      disabled={busyKey === section.key}
                      onClick={() => deleteItem(section, item.id)}
                      className="text-xs font-medium text-danger hover:underline disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

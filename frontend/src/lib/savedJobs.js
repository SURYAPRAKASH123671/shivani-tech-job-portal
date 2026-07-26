import { useCallback, useEffect, useState } from 'react'

// There is no backend endpoint for saving jobs (the candidate dashboard's "Jobs saved" stat is a
// static placeholder, always 0). Rather than add a fake button that does nothing, this persists
// the save state locally per-browser via localStorage - honestly scoped as a device-only
// convenience, not a synced feature, until a real backend endpoint exists for it.
const STORAGE_KEY = 'shivani_saved_jobs'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useSavedJobs() {
  const [savedIds, setSavedIds] = useState(() => readAll())

  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setSavedIds(readAll())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isSaved = useCallback((jobId) => savedIds.includes(jobId), [savedIds])

  const toggleSaved = useCallback((jobId) => {
    setSavedIds((current) => {
      const next = current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]
      writeAll(next)
      return next
    })
  }, [])

  return { savedIds, isSaved, toggleSaved }
}

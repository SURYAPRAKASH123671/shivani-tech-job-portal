// Like savedJobs.js: there's no backend view-tracking, so "Recently Viewed Jobs" is honestly
// scoped as a per-browser localStorage list of job IDs, recorded when JobDetail loads.
const STORAGE_KEY = 'shivani_recently_viewed_jobs'
const MAX_ITEMS = 10

export function recordView(jobId) {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const next = [jobId, ...current.filter((id) => id !== jobId)].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable (private browsing, quota) - recently-viewed is a convenience, not
    // critical, so fail silently rather than break the page.
  }
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

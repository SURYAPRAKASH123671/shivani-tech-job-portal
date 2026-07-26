/** Buckets a list of items with a date field into the last `months` calendar months, oldest first. */
export function bucketByMonth(items, dateField, months = 6) {
  const now = new Date()
  const buckets = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-IN', { month: 'short' }), count: 0 })
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]))
  for (const item of items) {
    const raw = item[dateField]
    if (!raw) continue
    const d = new Date(raw)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (byKey[key]) byKey[key].count += 1
  }
  return buckets.map(({ label, count }) => ({ label, count }))
}

/** Groups items by a key field, returning [{ name, value }] sorted descending - for pie/bar charts. */
export function groupCount(items, keyField, limit = 8) {
  const counts = new Map()
  for (const item of items) {
    const key = item[keyField] || 'Unknown'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

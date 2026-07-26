import { useMemo, useState } from 'react'

/** Generic client-side column sort - tables here are admin-scoped lists, not large enough to need server-side sorting. */
export function useSortedData(items, defaultKey = null, defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items
    const copy = [...items]
    copy.sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return copy
  }, [items, sortKey, sortDir])

  return { sorted, sortKey, sortDir, toggleSort }
}

/** Sortable <th> - click to sort, shows a direction arrow when active. */
export function SortableHeader({ label, sortKeyName, currentKey, currentDir, onSort, className = '' }) {
  const active = currentKey === sortKeyName
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKeyName)}
        className="inline-flex items-center gap-1 font-medium text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
      >
        {label}
        <span className="text-xs" aria-hidden="true">
          {active ? (currentDir === 'asc' ? '↑' : '↓') : ''}
        </span>
      </button>
    </th>
  )
}

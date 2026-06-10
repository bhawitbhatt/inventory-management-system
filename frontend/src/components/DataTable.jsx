import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { cn } from '../lib/utils.js'
import { ErrorState } from './ErrorState.jsx'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Skeleton } from './ui/skeleton.jsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx'

/**
 * Sortable + searchable + paginated data table.
 *
 * Replaces 4 different `<table>` patterns across Products, Customers, Orders,
 * and OrderDetail with a single primitive. Driven by a declarative `columns`
 * array; each column may opt in to sortable + search.
 *
 * @typedef {object} Column
 * @property {string} id                       Column identifier (also used as data key).
 * @property {React.ReactNode} header          Header label.
 * @property {(row: any) => any} [accessor]    Returns the sort/search value.
 * @property {(row: any) => React.ReactNode} [cell] Render override for the cell.
 * @property {boolean} [sortable=false]
 * @property {'left'|'right'|'center'} [align='left']
 * @property {string} [width]                  CSS width (e.g. '120px' or '20%').
 *
 * @param {object} props
 * @param {Column[]} props.columns
 * @param {any[]} props.rows
 * @param {(row: any) => string|number} props.getRowId
 * @param {string[]} [props.searchableKeys]    Column ids to include in client-side search.
 * @param {string} [props.searchPlaceholder='Search…']
 * @param {number} [props.pageSize=10]
 * @param {React.ReactNode} [props.emptyState] Rendered when the filtered rows are empty.
 * @param {boolean} [props.loading]            Renders skeleton rows.
 * @param {Error|null} [props.error]           Renders <ErrorState> instead of the table.
 * @param {() => void} [props.onRetry]
 * @param {(row: any) => void} [props.onRowClick] Make rows interactive (keyboard accessible).
 * @param {string} [props.className]
 */
export function DataTable({
  columns,
  rows = [],
  getRowId,
  searchableKeys,
  searchPlaceholder = 'Search…',
  pageSize = 10,
  emptyState,
  loading = false,
  error = null,
  onRetry,
  onRowClick,
  className,
}) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [page, setPage] = useState(0)

  const hasSearch = Array.isArray(searchableKeys) && searchableKeys.length > 0
  const interactive = typeof onRowClick === 'function'

  const filtered = useMemo(() => {
    if (!hasSearch || !query.trim()) return rows
    const q = query.trim().toLowerCase()
    return rows.filter((row) =>
      searchableKeys.some((key) => {
        const col = columns.find((c) => c.id === key)
        const value = col?.accessor ? col.accessor(row) : row[key]
        return String(value ?? '').toLowerCase().includes(q)
      }),
    )
  }, [rows, columns, searchableKeys, query, hasSearch])

  const sorted = useMemo(() => {
    if (!sortBy) return filtered
    const col = columns.find((c) => c.id === sortBy.id)
    if (!col) return filtered
    const getValue = col.accessor ?? ((row) => row[sortBy.id])
    const dir = sortBy.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = getValue(a)
      const bv = getValue(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1 * dir
      if (bv == null) return -1 * dir
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return (
        String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
      )
    })
  }, [filtered, sortBy, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const start = currentPage * pageSize
  const end = Math.min(start + pageSize, sorted.length)
  const pageRows = sorted.slice(start, end)

  function toggleSort(colId) {
    setSortBy((prev) => {
      if (!prev || prev.id !== colId) return { id: colId, dir: 'asc' }
      return { id: colId, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
    setPage(0)
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn’t load data"
        description={error.message ?? 'Please try again.'}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      {hasSearch ? (
        <div className="flex items-center gap-2 border-b border-border p-3">
          <div className="relative max-w-sm flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
              placeholder={searchPlaceholder}
              className="pl-8"
              aria-label={searchPlaceholder}
            />
          </div>
          {sorted.length > 0 ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col) => {
                const isSorted = sortBy?.id === col.id
                const Icon = isSorted
                  ? sortBy.dir === 'asc'
                    ? ChevronUp
                    : ChevronDown
                  : ChevronsUpDown
                return (
                  <TableHead
                    key={col.id}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.id)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                          col.align === 'right' && 'ml-auto',
                          col.align === 'center' && 'mx-auto',
                        )}
                        aria-sort={
                          isSorted
                            ? sortBy.dir === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        <span>{col.header}</span>
                        <Icon
                          className={cn('h-3.5 w-3.5', !isSorted && 'opacity-60')}
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-4 w-2/3" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center"
                >
                  {emptyState ?? (
                    <span className="text-sm text-muted-foreground">
                      No results found.
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const id = getRowId(row)
                return (
                  <TableRow
                    key={id}
                    onClick={interactive ? () => onRowClick(row) : undefined}
                    role={interactive ? 'link' : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    onKeyDown={
                      interactive
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onRowClick(row)
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      interactive &&
                        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    )}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                        )}
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.accessor
                            ? col.accessor(row)
                            : row[col.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && sorted.length > pageSize ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span className="tabular-nums">
            Showing {start + 1}–{end} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="tabular-nums">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

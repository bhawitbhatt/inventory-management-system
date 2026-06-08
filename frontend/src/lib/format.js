const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export function formatCurrency(value) {
  if (value == null || value === '') return '—'
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return CURRENCY.format(n)
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

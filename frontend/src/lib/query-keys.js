/**
 * TanStack Query key factories.
 *
 * Each resource owns a small object whose methods produce the canonical
 * `queryKey` array. Pages and hooks MUST import from here instead of
 * hard-coding `['products']` etc., so cross-resource invalidation stays
 * coherent.
 */

export const productKeys = {
  all: ['products'],
  list: () => [...productKeys.all, 'list'],
  detail: (id) => [...productKeys.all, 'detail', id],
}

export const customerKeys = {
  all: ['customers'],
  list: () => [...customerKeys.all, 'list'],
  detail: (id) => [...customerKeys.all, 'detail', id],
}

export const orderKeys = {
  all: ['orders'],
  list: () => [...orderKeys.all, 'list'],
  detail: (id) => [...orderKeys.all, 'detail', id],
}

export const dashboardKeys = {
  all: ['dashboard'],
}

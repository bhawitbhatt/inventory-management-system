import { Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { NativeSelect } from '../components/NativeSelect.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { Button } from '../components/ui/button.jsx'
import { useDeleteOrder, useOrders } from '../hooks/use-orders.js'
import { formatCurrency, formatDateTime } from '../lib/format.js'
import { ROUTES } from '../lib/routes.js'

const STATUS_VARIANT = {
  confirmed: 'success',
  pending: 'warn',
  cancelled: 'muted',
}

export default function Orders() {
  const ordersQ = useOrders()
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmCancel, setConfirmCancel] = useState(null)
  const deleteMut = useDeleteOrder()

  const rows = useMemo(() => {
    const data = ordersQ.data ?? []
    if (statusFilter === 'all') return data
    return data.filter((o) => o.status === statusFilter)
  }, [ordersQ.data, statusFilter])

  function handleConfirmCancel() {
    if (!confirmCancel) return
    deleteMut.mutate(confirmCancel.id, {
      onSuccess: () => setConfirmCancel(null),
      onError: () => setConfirmCancel(null),
    })
  }

  const columns = [
    {
      id: 'id',
      header: 'Order #',
      accessor: (row) => row.id,
      sortable: true,
      cell: (row) => (
        <Link
          to={ROUTES.orders.detail(row.id)}
          className="font-mono text-xs text-primary hover:underline"
        >
          #{row.id}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => row.customer?.full_name ?? `Customer ${row.customer_id}`,
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-foreground">
          {row.customer?.full_name ?? `Customer ${row.customer_id}`}
        </span>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      accessor: (row) => row.items.length,
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.items.length}
        </span>
      ),
    },
    {
      id: 'total_amount',
      header: 'Total',
      accessor: (row) => Number(row.total_amount),
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="tabular-nums font-semibold">
          {formatCurrency(row.total_amount)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <StatusBadge variant={STATUS_VARIANT[row.status] ?? 'muted'}>
          {row.status}
        </StatusBadge>
      ),
    },
    {
      id: 'created_at',
      header: 'Placed',
      accessor: (row) => row.created_at,
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: '160px',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.orders.detail(row.id)}>View</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmCancel(row)}
            aria-label={`Cancel order #${row.id}`}
          >
            <Trash2 className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      ),
    },
  ]

  if (ordersQ.error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Orders"
          description="Create and review customer orders."
        />
        <ErrorState
          title="Couldn’t load orders"
          description={ordersQ.error.message}
          onRetry={() => ordersQ.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Create and review customer orders. Stock is decremented atomically on confirmation."
        actions={
          <Button asChild>
            <Link to={ROUTES.orders.new}>
              <Plus className="h-4 w-4" />
              New order
            </Link>
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <label
          htmlFor="orders-status-filter"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Status
        </label>
        <div className="w-44">
          <NativeSelect
            id="orders-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </NativeSelect>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        searchableKeys={['id', 'customer']}
        searchPlaceholder="Search by order # or customer…"
        loading={ordersQ.isLoading}
        emptyState={
          <EmptyState
            icon={ShoppingCart}
            title={
              statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`
            }
            description={
              statusFilter === 'all'
                ? 'Create your first order to see it here.'
                : 'Try another status filter or create a new order.'
            }
            action={
              <Button asChild>
                <Link to={ROUTES.orders.new}>
                  <Plus className="h-4 w-4" />
                  Create order
                </Link>
              </Button>
            }
          />
        }
      />

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Cancel order?"
        description={
          confirmCancel
            ? `This will cancel order #${confirmCancel.id} and restore its line items to stock.`
            : undefined
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        variant="danger"
        busy={deleteMut.isPending}
        onCancel={() => setConfirmCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}

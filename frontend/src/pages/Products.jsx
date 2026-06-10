import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { dashboardApi } from '../api/dashboard.js'
import { DataTable } from '../components/DataTable.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { ProductForm } from '../components/forms/ProductForm.jsx'
import { Button } from '../components/ui/button.jsx'
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '../hooks/use-products.js'
import { formatCurrency, formatDateTime } from '../lib/format.js'
import { ROUTES } from '../lib/routes.js'
import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from '../lib/query-keys.js'

function stockVariant(qty, threshold) {
  if (qty === 0) return 'danger'
  if (qty <= threshold) return 'warn'
  return 'success'
}

export default function Products() {
  const productsQ = useProducts()
  const dashboardQ = useQuery({
    queryKey: dashboardKeys.all,
    queryFn: dashboardApi.get,
  })
  const threshold = dashboardQ.data?.low_stock_threshold ?? 10

  const [searchParams, setSearchParams] = useSearchParams()
  const filterLow = searchParams.get('filter') === 'low'

  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const createMut = useCreateProduct()
  const updateMut = useUpdateProduct()
  const deleteMut = useDeleteProduct()

  const rows = productsQ.data ?? []
  const visibleRows = filterLow
    ? rows.filter((p) => p.quantity_in_stock <= threshold)
    : rows

  function handleSubmit(payload) {
    if (editing === 'new') {
      createMut.mutate(payload, { onSuccess: () => setEditing(null) })
    } else if (editing && editing !== 'new') {
      updateMut.mutate(
        { id: editing.id, payload },
        { onSuccess: () => setEditing(null) },
      )
    }
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return
    deleteMut.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: () => setConfirmDelete(null),
    })
  }

  const columns = [
    {
      id: 'sku',
      header: 'SKU',
      accessor: (row) => row.sku,
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs text-foreground">{row.sku}</span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <Link
          to={ROUTES.products.detail(row.id)}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      accessor: (row) => Number(row.price),
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="tabular-nums">{formatCurrency(row.price)}</span>
      ),
    },
    {
      id: 'quantity_in_stock',
      header: 'In stock',
      accessor: (row) => row.quantity_in_stock,
      sortable: true,
      align: 'right',
      cell: (row) => (
        <StatusBadge variant={stockVariant(row.quantity_in_stock, threshold)}>
          {row.quantity_in_stock}
        </StatusBadge>
      ),
    },
    {
      id: 'updated_at',
      header: 'Updated',
      accessor: (row) => row.updated_at,
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground">
          {formatDateTime(row.updated_at)}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(row)}
            aria-label={`Edit ${row.name}`}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(row)}
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (productsQ.error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Products"
          description="Manage your product catalog and inventory levels."
        />
        <ErrorState
          title="Couldn’t load products"
          description={productsQ.error.message}
          onRetry={() => productsQ.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog and inventory levels."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        }
      />

      {filterLow ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-warn/40 bg-warn/10 px-4 py-2 text-sm">
          <span className="text-foreground">
            Filtered: <strong>Low stock</strong> (≤ {threshold})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchParams({})}
          >
            Clear filter
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={visibleRows}
        getRowId={(row) => row.id}
        searchableKeys={['sku', 'name']}
        searchPlaceholder="Search by name or SKU…"
        loading={productsQ.isLoading}
        emptyState={
          <EmptyState
            icon={Package}
            title={filterLow ? 'No low-stock products' : 'No products yet'}
            description={
              filterLow
                ? `All products are above the ${threshold}-unit threshold.`
                : 'Add your first product to get started.'
            }
            action={
              filterLow ? (
                <Button
                  variant="outline"
                  onClick={() => setSearchParams({})}
                >
                  Clear filter
                </Button>
              ) : (
                <Button onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" />
                  Add product
                </Button>
              )
            }
          />
        }
      />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing && editing !== 'new'
            ? `Edit product · ${editing.sku}`
            : 'Add product'
        }
      >
        <ProductForm
          product={editing && editing !== 'new' ? editing : null}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          busy={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete product?"
        description={
          confirmDelete
            ? `This will permanently delete "${confirmDelete.name}" (SKU ${confirmDelete.sku}).`
            : undefined
        }
        confirmLabel="Delete"
        variant="danger"
        busy={deleteMut.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

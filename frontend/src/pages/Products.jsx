import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { productsApi } from '../api/products.js'
import { extractError } from '../api/client.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import { formatCurrency, formatDateTime } from '../lib/format.js'

const DEFAULT_VALUES = { name: '', sku: '', price: '', quantity_in_stock: '' }

export default function Products() {
  const qc = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
  })

  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const createMut = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      toast.success('Product created')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setEditing(null)
    },
    onError: (e) => toast.error(extractError(e)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => productsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Product updated')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setEditing(null)
    },
    onError: (e) => toast.error(extractError(e)),
  })

  const deleteMut = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => {
      toast.success('Product deleted')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setConfirmDelete(null)
    },
    onError: (e) => {
      toast.error(extractError(e))
      setConfirmDelete(null)
    },
  })

  if (isLoading) return <Spinner />
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        Failed to load products: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your product catalog and inventory levels.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
          + Add product
        </button>
      </header>

      {data.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product to get started."
          action={
            <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
              Add product
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="table-th">SKU</th>
                <th className="table-th">Name</th>
                <th className="table-th">Price</th>
                <th className="table-th">In stock</th>
                <th className="table-th">Updated</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="table-td font-mono text-xs">{p.sku}</td>
                  <td className="table-td font-medium text-foreground">{p.name}</td>
                  <td className="table-td">{formatCurrency(p.price)}</td>
                  <td className="table-td">
                    <span
                      className={
                        p.quantity_in_stock <= 10
                          ? 'badge bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'badge bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }
                    >
                      {p.quantity_in_stock}
                    </span>
                  </td>
                  <td className="table-td text-muted-foreground">{formatDateTime(p.updated_at)}</td>
                  <td className="table-td text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn-ghost px-3 py-1.5 text-sm"
                        onClick={() => setEditing(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDelete(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal
        open={editing !== null}
        product={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSubmit={(payload) => {
          if (editing === 'new') createMut.mutate(payload)
          else updateMut.mutate({ id: editing.id, payload })
        }}
        busy={createMut.isPending || updateMut.isPending}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete product?"
        message={
          confirmDelete
            ? `This will permanently delete "${confirmDelete.name}" (SKU ${confirmDelete.sku}).`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleteMut.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => deleteMut.mutate(confirmDelete.id)}
      />
    </div>
  )
}

function ProductFormModal({ open, product, onClose, onSubmit, busy }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    values: product
      ? {
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity_in_stock: product.quantity_in_stock,
        }
      : DEFAULT_VALUES,
  })

  const submit = handleSubmit((values) => {
    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      price: String(values.price),
      quantity_in_stock: Number(values.quantity_in_stock),
    }
    onSubmit(payload)
  })

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={product ? `Edit product · ${product.sku}` : 'Add product'}
      footer={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              reset()
              onClose()
            }}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input"
            placeholder="e.g. Wireless Headphones"
            {...register('name', { required: 'Name is required', maxLength: 200 })}
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="sku">
            SKU
          </label>
          <input
            id="sku"
            className="input font-mono"
            placeholder="e.g. WH-1000"
            {...register('sku', { required: 'SKU is required', maxLength: 64 })}
          />
          {errors.sku && <p className="mt-1 text-xs text-destructive">{errors.sku.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="price">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="0.00"
              {...register('price', {
                required: 'Price is required',
                min: { value: 0, message: 'Must be ≥ 0' },
              })}
            />
            {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="qty">
              Quantity in stock
            </label>
            <input
              id="qty"
              type="number"
              step="1"
              min="0"
              className="input"
              placeholder="0"
              {...register('quantity_in_stock', {
                required: 'Quantity is required',
                min: { value: 0, message: 'Must be ≥ 0' },
                valueAsNumber: true,
              })}
            />
            {errors.quantity_in_stock && (
              <p className="mt-1 text-xs text-destructive">{errors.quantity_in_stock.message}</p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}

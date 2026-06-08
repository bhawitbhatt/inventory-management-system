import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { customersApi } from '../api/customers.js'
import { ordersApi } from '../api/orders.js'
import { productsApi } from '../api/products.js'
import { extractError } from '../api/client.js'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'
import { formatCurrency } from '../lib/format.js'

export default function OrderNew() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const customersQ = useQuery({ queryKey: ['customers'], queryFn: customersApi.list })
  const productsQ = useQuery({ queryKey: ['products'], queryFn: productsApi.list })

  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])

  const products = productsQ.data || []
  const productMap = useMemo(() => {
    const m = new Map()
    for (const p of products) m.set(String(p.id), p)
    return m
  }, [products])

  const subtotal = useMemo(() => {
    let total = 0
    for (const it of items) {
      const p = productMap.get(String(it.product_id))
      if (p && Number(it.quantity) > 0) {
        total += Number(p.price) * Number(it.quantity)
      }
    }
    return total
  }, [items, productMap])

  const createMut = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (order) => {
      toast.success(`Order #${order.id} created`)
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      navigate(`/orders/${order.id}`)
    },
    onError: (e) => toast.error(extractError(e)),
  })

  const isLoading = customersQ.isLoading || productsQ.isLoading
  if (isLoading) return <Spinner />

  const customers = customersQ.data || []
  if (customers.length === 0 || products.length === 0) {
    return (
      <EmptyState
        title="Not ready to create orders"
        description={
          customers.length === 0
            ? 'Add at least one customer first.'
            : 'Add at least one product first.'
        }
        action={
          <Link
            to={customers.length === 0 ? '/customers' : '/products'}
            className="btn-primary"
          >
            {customers.length === 0 ? 'Add customer' : 'Add product'}
          </Link>
        }
      />
    )
  }

  function updateItem(index, patch) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function addItem() {
    setItems((prev) => [...prev, { product_id: '', quantity: 1 }])
  }

  function removeItem(index) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!customerId) {
      toast.error('Select a customer')
      return
    }
    const valid = items.filter((it) => it.product_id && Number(it.quantity) > 0)
    if (valid.length === 0) {
      toast.error('Add at least one item')
      return
    }
    const aggregated = new Map()
    for (const it of valid) {
      const key = String(it.product_id)
      aggregated.set(key, (aggregated.get(key) || 0) + Number(it.quantity))
    }
    for (const [pid, qty] of aggregated) {
      const p = productMap.get(pid)
      if (p && p.quantity_in_stock < qty) {
        toast.error(
          `Insufficient stock for "${p.name}": requested ${qty}, available ${p.quantity_in_stock}`,
        )
        return
      }
    }

    createMut.mutate({
      customer_id: Number(customerId),
      items: valid.map((it) => ({
        product_id: Number(it.product_id),
        quantity: Number(it.quantity),
      })),
    })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a customer, add line items, and confirm. Stock is decremented automatically.
        </p>
      </header>

      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            <label htmlFor="order-customer">Customer</label>
          </h2>
          <select
            id="order-customer"
            className="input"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.email}
              </option>
            ))}
          </select>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Items</h2>
            <button type="button" className="btn-secondary text-xs" onClick={addItem}>
              + Add item
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {items.map((it, index) => {
              const p = productMap.get(String(it.product_id))
              const lineTotal = p ? Number(p.price) * Number(it.quantity || 0) : 0
              const productId = `order-item-${index}-product`
              const quantityId = `order-item-${index}-quantity`
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end"
                >
                  <div>
                    <label className="label" htmlFor={productId}>Product</label>
                    <select
                      id={productId}
                      className="input"
                      value={it.product_id}
                      onChange={(e) => updateItem(index, { product_id: e.target.value })}
                    >
                      <option value="">Select product…</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.sku}) · stock {prod.quantity_in_stock}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor={quantityId}>Quantity</label>
                    <input
                      id={quantityId}
                      type="number"
                      min="1"
                      step="1"
                      className="input"
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(index, { quantity: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <span className="label block">Line total</span>
                    <div className="input bg-muted font-medium">
                      {formatCurrency(lineTotal)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Server will recompute the total — this is a preview.
            </span>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Subtotal</p>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(subtotal)}
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link to="/orders" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={createMut.isPending}>
            {createMut.isPending ? 'Creating…' : 'Create order'}
          </button>
        </div>
      </form>
    </div>
  )
}

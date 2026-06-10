import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { extractError } from '../api/client.js'
import EmptyState from '../components/EmptyState.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import { NativeSelect } from '../components/NativeSelect.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/forms/FormField.jsx'
import { Button } from '../components/ui/button.jsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.jsx'
import { Input } from '../components/ui/input.jsx'
import { Skeleton } from '../components/ui/skeleton.jsx'
import { useCustomers } from '../hooks/use-customers.js'
import { useCreateOrder } from '../hooks/use-orders.js'
import { useProducts } from '../hooks/use-products.js'
import { formatCurrency } from '../lib/format.js'
import { ROUTES } from '../lib/routes.js'
import { orderFormSchema } from '../schemas/order-form.js'

const EMPTY_ITEM = { product_id: '', quantity: 1 }
const DEFAULT_VALUES = { customer_id: '', items: [EMPTY_ITEM] }

export default function OrderNew() {
  const navigate = useNavigate()
  const customersQ = useCustomers()
  const productsQ = useProducts()
  const createMut = useCreateOrder()

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const products = productsQ.data ?? []
  const customers = customersQ.data ?? []

  const productMap = useMemo(() => {
    const m = new Map()
    for (const p of products) m.set(String(p.id), p)
    return m
  }, [products])

  const subtotal = useMemo(() => {
    let total = 0
    for (const it of watchedItems ?? []) {
      const p = productMap.get(String(it.product_id))
      const qty = Number(it.quantity)
      if (p && qty > 0) total += Number(p.price) * qty
    }
    return total
  }, [watchedItems, productMap])

  const onSubmit = handleSubmit((values) => {
    // Client-side stock pre-check intentionally REMOVED — the server's atomic
    // compare-and-swap is the single source of truth. If stock is insufficient
    // the POST returns 409 and the inline error banner surfaces it.
    createMut.mutate(values, {
      onSuccess: (order) => {
        navigate(ROUTES.orders.detail(order.id))
      },
    })
  })

  if (customersQ.isLoading || productsQ.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="New order"
          description="Pick a customer, add line items, and confirm."
        />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    )
  }

  if (customers.length === 0 || products.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="New order"
          description="Pick a customer, add line items, and confirm."
        />
        <EmptyState
          icon={ShoppingCart}
          title="Not ready to create orders"
          description={
            customers.length === 0
              ? 'Add at least one customer first.'
              : 'Add at least one product first.'
          }
          action={
            <Button asChild>
              <Link
                to={customers.length === 0 ? ROUTES.customers : ROUTES.products.list}
              >
                {customers.length === 0 ? 'Add customer' : 'Add product'}
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const itemsError = errors.items?.message
  const submitError = createMut.isError ? extractError(createMut.error) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="New order"
        description="Pick a customer, add line items, and confirm. Stock is decremented atomically on confirmation."
      />

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Customer</CardTitle>
            <CardDescription className="text-xs">
              Who is this order for?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              label="Customer"
              htmlFor="order-customer"
              error={errors.customer_id?.message}
              required
            >
              <Controller
                control={control}
                name="customer_id"
                render={({ field }) => (
                  <NativeSelect
                    id="order-customer"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    <option value="">Select customer…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} — {c.email}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Items</CardTitle>
              <CardDescription className="text-xs">
                Pick products and quantities. Server validates stock.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(EMPTY_ITEM)}
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => {
              const watched = watchedItems?.[index]
              const product = productMap.get(String(watched?.product_id))
              const lineTotal =
                product && Number(watched?.quantity) > 0
                  ? Number(product.price) * Number(watched.quantity)
                  : 0
              const itemErrors = errors.items?.[index]
              const productId = `order-item-${index}-product`
              const quantityId = `order-item-${index}-quantity`
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_120px_140px_auto] sm:items-end"
                >
                  <FormField
                    label="Product"
                    htmlFor={productId}
                    error={itemErrors?.product_id?.message}
                  >
                    <Controller
                      control={control}
                      name={`items.${index}.product_id`}
                      render={({ field: f }) => (
                        <NativeSelect
                          id={productId}
                          value={f.value}
                          onChange={f.onChange}
                          onBlur={f.onBlur}
                        >
                          <option value="">Select product…</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) · stock {p.quantity_in_stock}
                            </option>
                          ))}
                        </NativeSelect>
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Quantity"
                    htmlFor={quantityId}
                    error={itemErrors?.quantity?.message}
                  >
                    <Input
                      id={quantityId}
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      {...register(`items.${index}.quantity`)}
                    />
                  </FormField>

                  <FormField label="Line total" htmlFor={`${quantityId}-total`}>
                    <Input
                      id={`${quantityId}-total`}
                      readOnly
                      className="bg-muted/60 font-medium tabular-nums"
                      value={formatCurrency(lineTotal)}
                      tabIndex={-1}
                    />
                  </FormField>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
            {itemsError ? (
              <p className="text-xs text-destructive" role="alert">
                {itemsError}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <span className="text-sm text-muted-foreground">
              Server recomputes the total from the price snapshot at order time.
            </span>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Subtotal preview
              </p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {formatCurrency(subtotal)}
              </p>
            </div>
          </CardContent>
        </Card>

        {submitError ? (
          <ErrorState
            title="Couldn’t place this order"
            description={submitError}
          />
        ) : null}

        <div className="flex justify-end gap-2">
          <Button asChild variant="outline" disabled={createMut.isPending}>
            <Link to={ROUTES.orders.list}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMut.isPending}>
            {createMut.isPending ? 'Placing order…' : 'Create order'}
          </Button>
        </div>
      </form>
    </div>
  )
}

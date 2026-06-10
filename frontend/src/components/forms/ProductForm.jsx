import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { productFormSchema } from '../../schemas/product-form.js'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { FormField } from './FormField.jsx'

const EMPTY_VALUES = {
  name: '',
  sku: '',
  price: '',
  quantity_in_stock: '',
}

/**
 * Product create/edit form.
 *
 * Self-contained: owns its own footer with Cancel + Submit buttons. The
 * parent renders this inside `<Modal>` (or any container) and wires the
 * mutation via `onSubmit`. Validation is owned by zod + react-hook-form.
 *
 * @param {object} props
 * @param {object} [props.product]            Editing? pass the existing product; omit for create.
 * @param {(payload: object) => void} props.onSubmit
 * @param {() => void} [props.onCancel]
 * @param {boolean} [props.busy]
 */
export function ProductForm({ product, onSubmit, onCancel, busy = false }) {
  const isEdit = product != null
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: isEdit
      ? {
          name: product.name,
          sku: product.sku,
          price: String(product.price),
          quantity_in_stock: product.quantity_in_stock,
        }
      : EMPTY_VALUES,
  })

  useEffect(() => {
    reset(
      isEdit
        ? {
            name: product.name,
            sku: product.sku,
            price: String(product.price),
            quantity_in_stock: product.quantity_in_stock,
          }
        : EMPTY_VALUES,
    )
  }, [product, isEdit, reset])

  const submit = handleSubmit((values) => {
    onSubmit({
      name: values.name,
      sku: values.sku,
      price: values.price,
      quantity_in_stock: Number(values.quantity_in_stock),
    })
  })

  const pending = busy || isSubmitting

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <FormField
        label="Name"
        htmlFor="product-name"
        error={errors.name?.message}
        required
      >
        <Input
          id="product-name"
          autoComplete="off"
          placeholder="e.g. Wireless Headphones"
          {...register('name')}
        />
      </FormField>

      <FormField
        label="SKU"
        htmlFor="product-sku"
        error={errors.sku?.message}
        required
      >
        <Input
          id="product-sku"
          autoComplete="off"
          placeholder="e.g. WH-1000"
          className="font-mono"
          {...register('sku')}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          label="Price (USD)"
          htmlFor="product-price"
          error={errors.price?.message}
          required
        >
          <Input
            id="product-price"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register('price')}
          />
        </FormField>

        <FormField
          label="Quantity in stock"
          htmlFor="product-qty"
          error={errors.quantity_in_stock?.message}
          required
        >
          <Input
            id="product-qty"
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            placeholder="0"
            {...register('quantity_in_stock')}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? 'Saving…'
            : isEdit
              ? 'Save changes'
              : 'Create product'}
        </Button>
      </div>
    </form>
  )
}

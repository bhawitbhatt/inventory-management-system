import { z } from 'zod'

/**
 * Validation contract for the product create/edit form.
 *
 * Matches the backend ProductCreate / ProductUpdate Pydantic models:
 *   - name: 1..200 chars
 *   - sku: 1..64 chars
 *   - price: non-negative decimal, sent as string to preserve precision
 *   - quantity_in_stock: integer >= 0
 */
export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name is too long'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(64, 'SKU is too long'),
  price: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Price is required')
    .refine((v) => !Number.isNaN(Number(v)), 'Price must be numeric')
    .refine((v) => Number(v) >= 0, 'Price must be ≥ 0'),
  quantity_in_stock: z
    .coerce.number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity must be ≥ 0')
    .max(1_000_000, 'Quantity is too large'),
})

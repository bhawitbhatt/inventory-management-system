import { z } from 'zod'

/**
 * Validation contract for the new-order form.
 *
 * The schema deliberately does NOT pre-check inventory levels — the server's
 * atomic compare-and-swap on stock is the single source of truth. Client-side
 * pre-checks raced with the server and produced false negatives, so they are
 * gone. If stock is insufficient, the POST /orders returns 409 and the form
 * surfaces it inline (via the createOrder mutation's error state).
 */
const orderItemSchema = z.object({
  product_id: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? v.trim() : v))
    .refine((v) => v !== '' && v != null, 'Pick a product')
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, 'Pick a product'),
  quantity: z
    .coerce.number({ invalid_type_error: 'Quantity must be a number' })
    .int('Whole numbers only')
    .min(1, 'Minimum 1'),
})

export const orderFormSchema = z.object({
  customer_id: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? v.trim() : v))
    .refine((v) => v !== '' && v != null, 'Pick a customer')
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, 'Pick a customer'),
  items: z.array(orderItemSchema).min(1, 'Add at least one item'),
})

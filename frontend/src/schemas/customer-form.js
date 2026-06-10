import { z } from 'zod'

/**
 * Validation contract for the customer create/edit form.
 *
 * Mirrors the backend CustomerCreate / CustomerUpdate Pydantic models:
 *   - full_name: 1..200 chars
 *   - email: valid email, case-normalized server-side
 *   - phone: 3..32 chars; client-side regex is tighter than the backend's
 *     to reject obviously-bad input early ("abc", "+++", etc.).
 */
const PHONE_PATTERN = /^[+\d][\d\s\-()+.]{2,}$/

export const customerFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name is too long'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email')
    .max(254, 'Email is too long'),
  phone: z
    .string()
    .trim()
    .min(3, 'Phone too short')
    .max(32, 'Phone too long')
    .regex(PHONE_PATTERN, 'Enter a valid phone number'),
})

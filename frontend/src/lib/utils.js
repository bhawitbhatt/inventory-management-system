import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — combine class names with proper tailwind merging.
 * Used pervasively by shadcn/ui-style components.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { createContext, forwardRef, useContext } from 'react'

import { cn } from '../../lib/utils.js'
import { toggleVariants } from './toggle.jsx'

const ToggleGroupContext = createContext({ size: 'default', variant: 'default' })

const ToggleGroup = forwardRef(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn('flex items-center justify-center gap-1', className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = forwardRef(({ className, children, variant, size, ...props }, ref) => {
  const ctx = useContext(ToggleGroupContext)
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleVariants({ variant: ctx.variant || variant, size: ctx.size || size }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }

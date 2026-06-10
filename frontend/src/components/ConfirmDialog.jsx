import { AlertTriangle } from 'lucide-react'

import { cn } from '../lib/utils.js'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.jsx'

/**
 * Accessible confirm dialog built on shadcn's `AlertDialog`.
 *
 * Replaces the prior Modal-wrapped ConfirmDialog whose buttons used the
 * legacy `.btn-*` classes. Radix AlertDialog forces focus into the dialog,
 * traps Tab, and ESC-to-cancel; we just add a danger affordance (icon +
 * destructive button styling) for delete flows.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} [props.title='Are you sure?']
 * @param {string} [props.description]
 * @param {string} [props.confirmLabel='Confirm']
 * @param {string} [props.cancelLabel='Cancel']
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {'default'|'danger'} [props.variant='default']
 * @param {boolean} [props.busy=false]
 */
export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  busy = false,
}) {
  const isDanger = variant === 'danger'
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel?.()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          {isDanger ? (
            <div
              aria-hidden="true"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
          ) : null}
          <AlertDialogTitle className={cn(isDanger && 'text-center')}>
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription
              className={cn(isDanger && 'text-center')}
            >
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              onConfirm?.()
            }}
            disabled={busy}
            className={cn(
              isDanger &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive',
            )}
          >
            {busy ? 'Working…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

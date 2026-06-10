import { cn } from '../../lib/utils.js'
import { Label } from '../ui/label.jsx'

/**
 * Label + control + error/hint stack used by all RHF forms.
 *
 * The control itself (Input / NativeSelect / Textarea) is passed as
 * `children`; this component owns the surrounding label + spacing +
 * error/hint affordances so every form field looks identical.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.htmlFor
 * @param {string} [props.error]
 * @param {string} [props.hint]
 * @param {boolean} [props.required]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

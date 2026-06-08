import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center gap-3 text-sm text-muted-foreground ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

export default function StatCard({ label, value, hint, accent = 'brand' }) {
  const accentClasses = {
    brand: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
  }[accent]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`badge ${accentClasses}`}>•</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value ?? '—'}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

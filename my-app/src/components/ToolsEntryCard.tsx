'use client'
// src/components/ToolEntryCard.tsx

import { TOOLS, COMPANY_NAMES, getPriceHint, ToolEntry } from '@/lib/tools'
type Props = {
  entry: ToolEntry
  index: number
  onChange: (id: number, field: keyof ToolEntry, value: string) => void
  onRemove: (id: number) => void
}

export default function ToolEntryCard({ entry, index, onChange, onRemove }: Props) {
  const tool = TOOLS[entry.company]
  const planObj = tool?.plans.find((p) => p.label === entry.plan)
  const isApi = tool?.isApi || planObj?.isApi
  const perSeat = planObj?.perSeat
  const hint = getPriceHint(entry.company, entry.plan, entry.seats)
  const autoFilled = planObj && planObj.price !== null && !planObj.perSeat

  function handleCompanyChange(val: string) {
    onChange(entry.id, 'company', val)
    onChange(entry.id, 'plan', '')
    onChange(entry.id, 'seats', '')
    onChange(entry.id, 'spend', '')
  }

  function handlePlanChange(val: string) {
    onChange(entry.id, 'plan', val)
    const t = TOOLS[entry.company]
    const p = t?.plans.find((pl) => pl.label === val)
    if (p && p.price !== null && !p.perSeat) {
      onChange(entry.id, 'spend', p.price.toString())
    } else {
      onChange(entry.id, 'spend', '')
    }
    onChange(entry.id, 'seats', '')
  }

  function handleSeatsChange(val: string) {
    onChange(entry.id, 'seats', val)
    if (planObj && planObj.price !== null && planObj.perSeat && val) {
      onChange(entry.id, 'spend', (planObj.price * parseInt(val || '0')).toString())
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-medium flex items-center justify-center flex-shrink-0">
          {index + 1}
        </div>
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100 flex-1">
          {entry.company || 'New tool'}
        </span>
        <button
          onClick={() => onRemove(entry.id)}
          aria-label="Remove this tool"
          className="text-neutral-400 hover:text-red-500 transition-colors p-1 rounded"
        >
          ✕
        </button>
      </div>

      {/* Card body */}
      <div className="p-4 grid gap-3">
        {/* Company dropdown */}
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            AI tool / company <span className="text-red-500">*</span>
          </label>
          <select
            value={entry.company}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="">Select company</option>
            {COMPANY_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Plan dropdown — only appears after company is selected */}
        {entry.company && (
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Plan <span className="text-red-500">*</span>
            </label>
            <select
              value={entry.plan}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Select plan</option>
              {tool?.plans.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Seats — only appears for per-seat plans */}
        {entry.plan && perSeat && (
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Number of seats <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              placeholder="e.g. 5"
              value={entry.seats}
              onChange={(e) => handleSeatsChange(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Spend — appears after plan is selected */}
        {entry.plan && (
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              {isApi || planObj?.price === null ? 'Monthly spend' : 'Monthly spend'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 pointer-events-none">
                $
              </span>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={entry.spend}
                readOnly={!!autoFilled && !perSeat}
                onChange={(e) => onChange(entry.id, 'spend', e.target.value)}
                className={`w-full text-sm pl-7 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${autoFilled && !perSeat
                    ? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100'
                  }`}
              />
            </div>
            {hint && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{hint}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
import { Gauge, History, Target, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { HistorySummary } from '../../lib/analytics'
import { formatTotalTime } from '../../utils/format'

/** Three headline numbers: average WPM, accuracy, sessions. */
export function StatsOverview({ summary }: { summary: HistorySummary }) {
  return (
    <section aria-label="Overview" className="grid grid-cols-3 gap-3">
      <StatTile icon={Gauge} label="Avg WPM" value={Math.round(summary.avgWpm)}>
        best {Math.round(summary.bestWpm)}
      </StatTile>
      <StatTile icon={Target} label="Accuracy" value={`${Math.floor(summary.avgAccuracy)}%`}>
        average
      </StatTile>
      <StatTile icon={History} label="Sessions" value={summary.sessions}>
        {formatTotalTime(summary.totalTimeMs)} typed
      </StatTile>
    </section>
  )
}

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  /** Muted sub-line. */
  children: ReactNode
}

function StatTile({ icon: Icon, label, value, children }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Icon className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
        {label}
      </span>
      <span className="text-2xl font-semibold tabular-nums text-slate-800 dark:text-slate-100">{value}</span>
      <span className="truncate text-xs text-slate-400 dark:text-slate-500">{children}</span>
    </div>
  )
}

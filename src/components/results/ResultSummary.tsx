import type { TypingStats } from '../../lib/stats'
import { formatDuration } from '../../utils/format'

/** The three headline numbers of a finished session. */
export function ResultSummary({ stats }: { stats: TypingStats }) {
  const items = [
    { label: 'wpm', value: Math.round(stats.wpm) },
    { label: 'accuracy', value: `${Math.floor(stats.accuracy)}%` },
    { label: 'time', value: formatDuration(stats.elapsedMs) },
  ]
  return (
    <dl className="grid grid-cols-3 gap-8 text-center sm:gap-16">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col-reverse gap-1">
          <dt className="text-sm text-slate-500 dark:text-slate-400">{item.label}</dt>
          <dd className="text-4xl font-semibold tabular-nums text-amber-600 dark:text-amber-400 sm:text-5xl">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

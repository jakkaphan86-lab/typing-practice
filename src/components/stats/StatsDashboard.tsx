import { Activity, Crosshair, Gauge, History, Target, TrendingUp, type LucideIcon } from 'lucide-react'
import { lazy, Suspense, type ReactNode } from 'react'
import { PROGRESS_LIMIT, useGlobalStats } from '../../hooks/useAnalytics'
import { describeChar, formatTotalTime } from '../../lib/analytics'
import { KeyCap } from './KeyCap'

// Recharts is large: load it only when the stats tab is opened.
const WpmProgressChart = lazy(() => import('./WpmProgressChart'))

const WEAKEST_LIMIT = 5

/**
 * Global analytics in three chunks (Miller's Law): headline numbers, the WPM
 * trend, and a short "weakest keys" list.
 */
export function StatsDashboard() {
  const stats = useGlobalStats(WEAKEST_LIMIT)

  if (stats === undefined) {
    return <p className="py-12 text-center text-sm text-slate-400">Loading…</p>
  }

  const { summary, weakestKeys, totalErrors, progress } = stats

  if (!summary) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Activity className="size-6" aria-hidden />
        </span>
        <p className="font-medium text-slate-700 dark:text-slate-200">No sessions yet</p>
        <p className="max-w-60 text-sm text-slate-500 dark:text-slate-400">
          Finish a passage and your speed, accuracy and weakest keys will show up here.
        </p>
      </div>
    )
  }

  const maxCount = weakestKeys[0]?.count ?? 1

  return (
    <div className="flex flex-col gap-8">
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

      <section aria-labelledby="wpm-progress" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h3
            id="wpm-progress"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <TrendingUp className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
            WPM progress
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {progress.length === PROGRESS_LIMIT ? `last ${PROGRESS_LIMIT} sessions` : 'all sessions'} · - - avg
          </span>
        </div>
        <Suspense fallback={<div className="h-44 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50" />}>
          <WpmProgressChart data={progress} average={Math.round(summary.avgWpm)} />
        </Suspense>
        {progress.length < 2 && (
          <p className="text-xs text-slate-400 dark:text-slate-500">Finish another session to see your trend.</p>
        )}
      </section>

      <section aria-labelledby="weakest-keys" className="flex flex-col gap-3">
        <h3
          id="weakest-keys"
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          <Crosshair className="size-4 text-red-500 dark:text-red-400" aria-hidden />
          Weakest keys
        </h3>

        {weakestKeys.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
            No missed keys recorded. Impressive!
          </p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {weakestKeys.map((k) => {
              const { name } = describeChar(k.char)
              const typedAs = k.typedAs ? describeChar(k.typedAs) : null
              return (
                <li key={k.char} className="flex items-center gap-3">
                  <KeyCap char={k.char} size="sm" tone="error" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-slate-500 dark:text-slate-400" lang="th">
                        {name && <span className="mr-1.5 text-slate-600 dark:text-slate-300">{name}</span>}
                        {typedAs && <>often typed as “{typedAs.glyph}”</>}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                        {k.count}× · {Math.round(k.share * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-red-400/80 dark:bg-red-400/70"
                        style={{ width: `${(k.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <p className="text-xs text-slate-400 dark:text-slate-500">
          {totalErrors.toLocaleString()} missed keystroke{totalErrors === 1 ? '' : 's'} across{' '}
          {summary.sessions} session{summary.sessions === 1 ? '' : 's'}
        </p>
      </section>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  children: ReactNode
}) {
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

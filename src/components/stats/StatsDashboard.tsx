import { Activity } from 'lucide-react'
import { useGlobalStats } from '../../hooks/useAnalytics'
import { PracticeWeakKeysButton } from './PracticeWeakKeysButton'
import { StatsOverview } from './StatsOverview'
import { WeakestKeysSection } from './WeakestKeysSection'
import { WpmProgressSection } from './WpmProgressSection'

const WEAKEST_LIMIT = 5

/**
 * "My stats" tab, in three chunks (Miller's Law): headline numbers, the WPM
 * trend, and a short weakest-keys list with a drill to practise them.
 */
export function StatsDashboard() {
  const stats = useGlobalStats(WEAKEST_LIMIT)

  if (stats === undefined) return <p className="py-12 text-center text-sm text-slate-400">Loading…</p>

  const { summary, weakestKeys, totalErrors, progress } = stats
  if (!summary) return <EmptyStats />

  return (
    <div className="flex flex-col gap-8">
      <StatsOverview summary={summary} />
      <WpmProgressSection progress={progress} averageWpm={Math.round(summary.avgWpm)} />
      <WeakestKeysSection keys={weakestKeys} totalErrors={totalErrors} sessions={summary.sessions} />
      <PracticeWeakKeysButton weakKeys={weakestKeys.map((k) => k.char)} />
    </div>
  )
}

function EmptyStats() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Activity className="size-6" aria-hidden />
      </span>
      <p className="font-medium text-slate-700 dark:text-slate-200">No sessions yet</p>
      <p className="max-w-60 text-sm text-slate-500 dark:text-slate-400">
        Finish a passage and your speed, accuracy and weakest keys will show up here.
      </p>
      <div className="mt-6 w-full">
        <PracticeWeakKeysButton weakKeys={[]} />
      </div>
    </div>
  )
}

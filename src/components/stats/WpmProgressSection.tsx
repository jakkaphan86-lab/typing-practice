import { TrendingUp } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { PROGRESS_LIMIT, type ProgressPoint } from '../../hooks/useAnalytics'
import { SectionHeading } from './SectionHeading'

// Recharts is large: load it only when the stats tab is opened.
const WpmProgressChart = lazy(() => import('./WpmProgressChart'))

interface WpmProgressSectionProps {
  progress: readonly ProgressPoint[]
  averageWpm: number
}

export function WpmProgressSection({ progress, averageWpm }: WpmProgressSectionProps) {
  return (
    <section aria-labelledby="wpm-progress" className="flex flex-col gap-3">
      <SectionHeading
        id="wpm-progress"
        icon={TrendingUp}
        iconClassName="text-amber-600 dark:text-amber-400"
        aside={`${progress.length === PROGRESS_LIMIT ? `last ${PROGRESS_LIMIT} sessions` : 'all sessions'} · - - avg`}
      >
        WPM progress
      </SectionHeading>
      <Suspense fallback={<div className="h-44 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50" />}>
        <WpmProgressChart data={progress} average={averageWpm} />
      </Suspense>
      {progress.length < 2 && (
        <p className="text-xs text-slate-400 dark:text-slate-500">Finish another session to see your trend.</p>
      )}
    </section>
  )
}

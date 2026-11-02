import { memo } from 'react'
import { useLiveStats } from '../../hooks/useLiveStats'
import type { SessionCounters } from '../../lib/stats'

interface LiveStatsBarProps {
  counters: SessionCounters
  running: boolean
  blockIndex: number
  blockCount: number
}

/** Real-time stats. Deliberately tiny: two numbers and a page indicator. */
export const LiveStatsBar = memo(function LiveStatsBar({ counters, running, blockIndex, blockCount }: LiveStatsBarProps) {
  const stats = useLiveStats(counters, running)
  return (
    <div className="flex w-full items-baseline justify-between text-sm text-slate-500 dark:text-slate-400">
      <div className="flex items-baseline gap-6">
        <Stat value={Math.round(stats.wpm)} label="wpm" />
        <Stat value={`${Math.floor(stats.accuracy)}%`} label="acc" />
      </div>
      <span className="tabular-nums text-slate-400 dark:text-slate-500">
        {blockIndex + 1} / {blockCount}
      </span>
    </div>
  )
})

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">{value}</span>
      <span>{label}</span>
    </span>
  )
}

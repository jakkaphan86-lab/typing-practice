import { useEffect, useMemo, useState } from 'react'
import { computeStats, type SessionCounters, type TypingStats } from '../lib/stats'

const TICK_MS = 250

/**
 * Real-time WPM/accuracy. The clock lives here — not in the engine — so only
 * the component showing live stats re-renders on each tick (and nothing ticks
 * when live stats are hidden).
 */
export function useLiveStats(counters: SessionCounters, running: boolean): TypingStats {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [running])

  return useMemo(() => computeStats(counters, now), [counters, now])
}

import { useLiveQuery } from 'dexie-react-hooks'
import {
  MissTally,
  rankMissedChars,
  summarizeHistory,
  type HistorySummary,
  type MissedChar,
} from '../lib/analytics'
import { db } from '../lib/db'

/** One point on the WPM progress chart. */
export interface ProgressPoint {
  /** 1-based session number across all history. */
  session: number
  timestamp: number
  wpm: number
  accuracy: number
}

export interface GlobalStats {
  summary: HistorySummary | null
  weakestKeys: MissedChar[]
  totalErrors: number
  /** The most recent sessions, oldest first. */
  progress: ProgressPoint[]
}

/** Sessions plotted on the progress chart (keeps it readable). */
export const PROGRESS_LIMIT = 30

const EMPTY: GlobalStats = { summary: null, weakestKeys: [], totalErrors: 0, progress: [] }

/**
 * Global statistics over every session ever recorded (including sessions
 * whose custom text has since been deleted). Live: updates as sessions finish.
 * Returns undefined while loading.
 */
export function useGlobalStats(weakestLimit = 5): GlobalStats | undefined {
  return useLiveQuery(async () => {
    try {
      const history = await db.typingHistory.orderBy('timestamp').toArray()
      const tally = new MissTally()
      await db.errorLogs.each((e) => tally.add(e.expectedChar, e.typedChar))
      return {
        summary: summarizeHistory(history),
        weakestKeys: tally.top(weakestLimit),
        totalErrors: tally.total,
        progress: history.slice(-PROGRESS_LIMIT).map((h, i, recent) => ({
          session: history.length - recent.length + i + 1,
          timestamp: h.timestamp,
          wpm: Math.round(h.wpm),
          accuracy: h.accuracy,
        })),
      }
    } catch {
      return EMPTY // IndexedDB unavailable
    }
  }, [weakestLimit])
}

/** Most-missed characters for a single session (by `typingHistory` id). */
export function useSessionMisses(sessionId: number | null, limit = 3): MissedChar[] | undefined {
  return useLiveQuery(async () => {
    if (sessionId === null) return []
    const rows = await db.errorLogs.where('sessionId').equals(sessionId).toArray()
    return rankMissedChars(rows, limit)
  }, [sessionId, limit])
}

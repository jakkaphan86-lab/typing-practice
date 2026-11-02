/** Persisting finished typing sessions. */
import { db, type TextId } from './db'
import type { TypingStats } from './stats'
import type { KeystrokeError } from './typingEngine'

export interface SessionRecord {
  textId: TextId
  stats: TypingStats
  errors: readonly KeystrokeError[]
  timestamp: number
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Persist a finished session: one history row + one row per wrong keystroke.
 * Returns the history id, which doubles as the session id in `errorLogs`.
 */
export async function recordSession({ textId, stats, errors, timestamp }: SessionRecord): Promise<number> {
  return db.transaction('rw', [db.typingHistory, db.errorLogs], async () => {
    const sessionId = await db.typingHistory.add({
      textId,
      wpm: round1(stats.wpm),
      rawWpm: round1(stats.rawWpm),
      accuracy: round1(stats.accuracy),
      durationMs: stats.elapsedMs,
      timestamp,
    })
    if (errors.length > 0) {
      await db.errorLogs.bulkAdd(
        errors.map((e) => ({
          textId,
          sessionId,
          expectedChar: e.expected,
          typedChar: e.typed,
          timestamp: e.timestamp,
        })),
      )
    }
    return sessionId
  })
}

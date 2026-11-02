import { useEffect, useRef, useState } from 'react'
import { recordSession, type TextId } from '../lib/db'
import type { TypingEngine } from './useTypingEngine'

export type SaveStatus = 'saving' | 'saved' | 'error'

/**
 * Writes each *finished* session to Dexie exactly once: a `typingHistory` row
 * plus every wrong keystroke into `errorLogs`. Abandoned sessions are not saved.
 */
export function useSessionRecorder(engine: TypingEngine, textId: TextId | null): SaveStatus | null {
  const [save, setSave] = useState<{ session: number; status: SaveStatus } | null>(null)
  const recorded = useRef<number | null>(null)

  const { status, startedAt, stats, errors } = engine

  useEffect(() => {
    if (status !== 'finished' || startedAt === null || textId === null) return
    if (recorded.current === startedAt) return
    recorded.current = startedAt

    setSave({ session: startedAt, status: 'saving' })
    recordSession({
      textId,
      wpm: Math.round(stats.wpm * 10) / 10,
      rawWpm: Math.round(stats.rawWpm * 10) / 10,
      accuracy: Math.round(stats.accuracy * 10) / 10,
      durationMs: stats.elapsedMs,
      timestamp: Date.now(),
      errors,
    })
      .then(() => setSave({ session: startedAt, status: 'saved' }))
      .catch((err: unknown) => {
        console.error('Failed to save typing session', err)
        setSave({ session: startedAt, status: 'error' })
      })
    // stats/errors change every render while typing; the guards above make it run once.
  }, [status, startedAt, textId, stats, errors])

  return save && save.session === startedAt ? save.status : null
}

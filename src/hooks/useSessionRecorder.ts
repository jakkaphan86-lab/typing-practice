import { useEffect, useRef, useState } from 'react'
import type { TextId } from '../lib/db'
import { recordSession } from '../lib/sessions'
import type { TypingEngine } from './useTypingEngine'

export type SaveStatus = 'saving' | 'saved' | 'error'

export interface SaveState {
  status: SaveStatus
  /** `typingHistory` id once saved — used to look up this session's errors. */
  sessionId: number | null
}

type FinishedSession = Pick<TypingEngine, 'finalStats' | 'startedAt' | 'errors'>

/**
 * Writes each *finished* session to Dexie exactly once: a `typingHistory` row
 * plus every wrong keystroke into `errorLogs`. Abandoned sessions are not saved.
 */
export function useSessionRecorder(
  { finalStats, startedAt, errors }: FinishedSession,
  textId: TextId | null,
): SaveState | null {
  const [save, setSave] = useState<{ session: number; state: SaveState } | null>(null)
  const recorded = useRef<number | null>(null)

  useEffect(() => {
    if (!finalStats || startedAt === null || textId === null || recorded.current === startedAt) return
    recorded.current = startedAt

    setSave({ session: startedAt, state: { status: 'saving', sessionId: null } })
    recordSession({ textId, stats: finalStats, errors, timestamp: Date.now() })
      .then((sessionId) => setSave({ session: startedAt, state: { status: 'saved', sessionId } }))
      .catch((err: unknown) => {
        console.error('Failed to save typing session', err)
        setSave({ session: startedAt, state: { status: 'error', sessionId: null } })
      })
  }, [finalStats, startedAt, errors, textId])

  return save?.session === startedAt ? save.state : null
}

import { useCallback, useMemo, useReducer } from 'react'
import { buildBlocks, type MeasureText, type TextBlock } from '../lib/blocks'
import { computeStats, type SessionCounters, type TypingStats } from '../lib/stats'
import { createInitialState, engineReducer, getStatus, type EngineStatus, type KeystrokeError } from '../lib/typingEngine'

export interface TypingEngineOptions {
  /** BCP-47 locale used for word segmentation ('th', 'en', ...). */
  locale: string
  linesPerBlock: number
  /** Available line width (px when `measure` is given, else characters). */
  maxLineWidth: number
  measure?: MeasureText
}

export interface TypingEngine {
  block: TextBlock | undefined
  blockIndex: number
  blockCount: number
  /** Expected code points of the current block. */
  target: readonly string[]
  /** Typed code points of the current block. */
  typed: readonly string[]
  status: EngineStatus
  /** Raw counters for live stats (stable identity until a keystroke changes them). */
  counters: SessionCounters
  /** Final stats, computed once when the session finishes; null before that. */
  finalStats: TypingStats | null
  /** Wrong keystrokes in this session (for the error log). */
  errors: readonly KeystrokeError[]
  /** Identifies the session; changes on every new attempt. */
  startedAt: number | null
  typeChars: (chars: readonly string[]) => void
  backspace: (word: boolean) => void
  reset: () => void
}

/**
 * React binding for the pure engine in `lib/typingEngine.ts`. Knows nothing
 * about DOM input or timers — see `useTypingInput` and `useLiveStats`.
 */
export function useTypingEngine(text: string, options: TypingEngineOptions): TypingEngine {
  const { locale, linesPerBlock, maxLineWidth, measure } = options

  const blocks = useMemo(
    () => buildBlocks(text, { locale, linesPerBlock, maxLineWidth, measure }),
    [text, locale, linesPerBlock, maxLineWidth, measure],
  )

  const [state, dispatch] = useReducer(engineReducer, blocks, createInitialState)

  // New text/layout → restart (state update during render, no stale frame).
  if (state.blocks !== blocks) dispatch({ type: 'reset', blocks })

  const typeChars = useCallback((chars: readonly string[]) => {
    if (chars.length > 0) dispatch({ type: 'type', chars, now: Date.now() })
  }, [])
  const backspace = useCallback((word: boolean) => dispatch({ type: 'backspace', word }), [])
  const reset = useCallback(() => dispatch({ type: 'reset', blocks }), [blocks])

  const { startedAt, finishedAt, correctKeystrokes, totalKeystrokes } = state
  const counters = useMemo<SessionCounters>(
    () => ({ startedAt, correctKeystrokes, totalKeystrokes }),
    [startedAt, correctKeystrokes, totalKeystrokes],
  )
  const finalStats = useMemo(
    () => (finishedAt === null ? null : computeStats(counters, finishedAt)),
    [counters, finishedAt],
  )

  return {
    block: state.blocks[state.blockIndex],
    blockIndex: state.blockIndex,
    blockCount: state.blocks.length,
    target: state.target,
    typed: state.typed,
    status: getStatus(state),
    counters,
    finalStats,
    errors: state.errors,
    startedAt,
    typeChars,
    backspace,
    reset,
  }
}

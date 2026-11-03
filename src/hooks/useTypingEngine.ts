import { useCallback, useLayoutEffect, useMemo, useReducer, useRef } from 'react'
import { buildBlocks, type MeasureText, type TextBlock } from '../lib/blocks'
import { computeStats, type SessionCounters, type TypingStats } from '../lib/stats'
import {
  createInitialState,
  describeKeystrokes,
  engineReducer,
  getStatus,
  type EngineAction,
  type EngineStatus,
  type KeystrokeError,
  type KeystrokeFeedback,
} from '../lib/typingEngine'

export interface TypingEngineOptions {
  /** BCP-47 locale used for word segmentation ('th', 'en', ...). */
  locale: string
  linesPerBlock: number
  /** Available line width (px when `measure` is given, else characters). */
  maxLineWidth: number
  measure?: MeasureText
  /**
   * Called synchronously from the keystroke handler, as soon as the keystroke
   * has been evaluated and before React re-renders (e.g. to play a sound).
   */
  onFeedback?: (feedback: KeystrokeFeedback) => void
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

/** The text a set of blocks spells out (layout-independent). */
const passageOf = (blocks: readonly TextBlock[]) => blocks.map((b) => b.chars.join('')).join('')

/**
 * React binding for the pure engine in `lib/typingEngine.ts`. Knows nothing
 * about DOM input, timers or audio — see `useTypingInput`, `useLiveStats` and
 * the `onFeedback` option.
 */
export function useTypingEngine(text: string, options: TypingEngineOptions): TypingEngine {
  const { locale, linesPerBlock, maxLineWidth, measure, onFeedback } = options

  const blocks = useMemo(
    () => buildBlocks(text, { locale, linesPerBlock, maxLineWidth, measure }),
    [text, locale, linesPerBlock, maxLineWidth, measure],
  )

  const [state, dispatch] = useReducer(engineReducer, blocks, createInitialState)

  // A new passage restarts at once. A layout-only change (web fonts finished
  // loading, window resized) is applied only while idle — re-wrapping
  // mid-session would wipe the user's progress; it takes effect on the next
  // restart instead (`reset` always uses the latest blocks).
  // State update during render: no stale frame.
  const nextPassage = useMemo(() => passageOf(blocks), [blocks])
  const currentPassage = useMemo(() => passageOf(state.blocks), [state.blocks])
  if (state.blocks !== blocks && (getStatus(state) === 'idle' || nextPassage !== currentPassage)) {
    dispatch({ type: 'reset', blocks })
  }

  // Latest state, readable from event handlers. Synced on every commit, and
  // advanced optimistically in `apply` so back-to-back events within one frame
  // also see it. The reducer is pure, so running it here and again inside React
  // yields the same result.
  const stateRef = useRef(state)
  const onFeedbackRef = useRef(onFeedback)
  useLayoutEffect(() => {
    stateRef.current = state
    onFeedbackRef.current = onFeedback
  })

  const apply = useCallback((action: EngineAction) => {
    const prev = stateRef.current
    const next = engineReducer(prev, action)
    stateRef.current = next
    dispatch(action)
    return { prev, next }
  }, [])

  const typeChars = useCallback(
    (chars: readonly string[]) => {
      if (chars.length === 0) return
      const { prev, next } = apply({ type: 'type', chars, now: Date.now() })
      // Evaluated outside the reducer (which must stay pure — StrictMode runs it twice).
      if (next !== prev) onFeedbackRef.current?.(describeKeystrokes(prev, next))
    },
    [apply],
  )
  const backspace = useCallback((word: boolean) => void apply({ type: 'backspace', word }), [apply])
  const reset = useCallback(() => void apply({ type: 'reset', blocks }), [apply, blocks])

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

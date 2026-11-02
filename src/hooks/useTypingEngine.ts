import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CompositionEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { buildBlocks, type TextBlock } from '../lib/blocks'
import { calcAccuracy, calcWpm } from '../lib/stats'

/* ------------------------------------------------------------------ */
/* State machine                                                       */
/* ------------------------------------------------------------------ */

export type EngineStatus = 'idle' | 'running' | 'finished'

/** One wrong keystroke, kept for the error log. */
export interface KeystrokeError {
  expected: string
  typed: string
  timestamp: number
}

export interface EngineState {
  blocks: TextBlock[]
  blockIndex: number
  /** Expected code points for the current block (may be reordered, see canSwap). */
  target: string[]
  /** Code points typed in the current block. Cursor = typed.length. */
  typed: string[]
  /** Cumulative over the whole session. Backspace never refunds keystrokes. */
  correctKeystrokes: number
  totalKeystrokes: number
  startedAt: number | null
  finishedAt: number | null
  errors: KeystrokeError[]
}

export type EngineAction =
  | { type: 'type'; chars: string[]; now: number }
  | { type: 'backspace'; word: boolean }
  | { type: 'reset'; blocks: TextBlock[] }

export function createInitialState(blocks: TextBlock[]): EngineState {
  return {
    blocks,
    blockIndex: 0,
    target: blocks[0]?.chars.slice() ?? [],
    typed: [],
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    startedAt: null,
    finishedAt: null,
    errors: [],
  }
}

/**
 * Thai tolerance: inside one grapheme cluster, the marks after the base
 * consonant can be typed in either order (e.g. "กิ่" as ก ิ ่ or ก ่ ิ, or
 * "ม่ำ" as ม ่ ำ or ม ำ ่). Both look identical on screen, so if the typed
 * code point is the *next* expected one in the same cluster, accept it and
 * swap the expected order instead of flagging an error.
 */
function canSwap(block: TextBlock, target: string[], i: number, ch: string): boolean {
  const j = i + 1
  if (j >= target.length || target[j] !== ch) return false
  const cluster = block.charToCluster[i]
  return cluster === block.charToCluster[j] && block.clusters[cluster].start < i
}

export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'reset':
      return createInitialState(action.blocks)

    case 'type': {
      if (state.finishedAt !== null || state.blocks.length === 0) return state

      let { blockIndex, target, correctKeystrokes, totalKeystrokes } = state
      let startedAt: number | null = state.startedAt
      let finishedAt: number | null = null
      let typed = state.typed.slice()
      let targetOwned = false
      const newErrors: KeystrokeError[] = []

      for (const ch of action.chars) {
        if (finishedAt !== null) break
        if (ch === '\n' || ch === '\r') continue
        startedAt ??= action.now

        const i = typed.length
        if (ch !== target[i] && canSwap(state.blocks[blockIndex], target, i, ch)) {
          if (!targetOwned) {
            target = target.slice()
            targetOwned = true
          }
          ;[target[i], target[i + 1]] = [target[i + 1], target[i]]
        }

        totalKeystrokes++
        if (ch === target[i]) correctKeystrokes++
        else newErrors.push({ expected: target[i], typed: ch, timestamp: action.now })
        typed.push(ch)

        // Block complete → swap in the next static block (or finish).
        if (typed.length >= target.length) {
          if (blockIndex + 1 < state.blocks.length) {
            blockIndex++
            target = state.blocks[blockIndex].chars.slice()
            targetOwned = true
            typed = []
          } else {
            finishedAt = action.now
          }
        }
      }

      const errors = newErrors.length > 0 ? [...state.errors, ...newErrors] : state.errors
      return {
        ...state,
        blockIndex,
        target,
        typed,
        correctKeystrokes,
        totalKeystrokes,
        startedAt,
        finishedAt,
        errors,
      }
    }

    case 'backspace': {
      // Backspace is limited to the current block: finished blocks are gone.
      if (state.finishedAt !== null || state.typed.length === 0) return state
      let n = state.typed.length
      if (action.word) {
        while (n > 0 && state.target[n - 1] === ' ') n--
        while (n > 0 && state.target[n - 1] !== ' ') n--
      } else {
        n--
      }
      return { ...state, typed: state.typed.slice(0, n) }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export interface TypingEngineOptions {
  /** BCP-47 locale used for word segmentation ('th', 'en', ...). */
  locale: string
  linesPerBlock?: number
  /** Available line width (px when `measure` is given, else characters). */
  maxLineWidth: number
  measure?: (text: string) => number
  /**
   * When false, the global key listener is detached (e.g. while a dialog with
   * its own form fields is open) so keystrokes are not stolen. Default true.
   */
  captureGlobalKeys?: boolean
}

export interface TypingStats {
  /** Net WPM: correct keystrokes / 5 / minutes. */
  wpm: number
  /** Raw WPM: all keystrokes / 5 / minutes. */
  rawWpm: number
  accuracy: number
  elapsedMs: number
  correctKeystrokes: number
  totalKeystrokes: number
}

const TICK_MS = 250

export function useTypingEngine(text: string, options: TypingEngineOptions) {
  const { locale, linesPerBlock = 3, maxLineWidth, measure, captureGlobalKeys = true } = options

  const blocks = useMemo(
    () => buildBlocks(text, { locale, linesPerBlock, maxLineWidth, measure }),
    [text, locale, linesPerBlock, maxLineWidth, measure],
  )

  const [state, dispatch] = useReducer(engineReducer, blocks, createInitialState)

  // New text/layout → restart (state update during render, no stale frame).
  if (state.blocks !== blocks) dispatch({ type: 'reset', blocks })

  const status: EngineStatus =
    state.finishedAt !== null ? 'finished' : state.startedAt !== null ? 'running' : 'idle'

  // Re-render periodically while running so real-time WPM stays live.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [status])

  const elapsedMs =
    state.startedAt === null ? 0 : Math.max(0, (state.finishedAt ?? now) - state.startedAt)

  const stats: TypingStats = {
    wpm: calcWpm(state.correctKeystrokes, elapsedMs),
    rawWpm: calcWpm(state.totalKeystrokes, elapsedMs),
    accuracy: calcAccuracy(state.correctKeystrokes, state.totalKeystrokes),
    elapsedMs,
    correctKeystrokes: state.correctKeystrokes,
    totalKeystrokes: state.totalKeystrokes,
  }

  /* ---------------- input capture (hidden <input>) ---------------- */

  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    dispatch({ type: 'reset', blocks })
    setNow(Date.now())
    inputRef.current?.focus()
  }, [blocks])

  /** Move whatever the browser inserted into the hidden input into the engine. */
  const flushInput = useCallback(() => {
    const el = inputRef.current
    if (!el || !el.value) return
    const chars = Array.from(el.value.normalize('NFC'))
    el.value = ''
    dispatch({ type: 'type', chars, now: Date.now() })
  }, [])

  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      dispatch({ type: 'backspace', word: e.ctrlKey || e.altKey || e.metaKey })
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
    }
  }, [])

  const onInput = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      // Wait for IME composition to finish; compositionend will flush.
      if ((e.nativeEvent as InputEvent).isComposing) return
      flushInput()
    },
    [flushInput],
  )

  const onCompositionEnd = useCallback(
    (_e: CompositionEvent<HTMLInputElement>) => flushInput(),
    [flushInput],
  )

  // Global listener: Escape restarts; any typing key while the hidden input is
  // unfocused focuses it first, so the keystroke lands in the input.
  useEffect(() => {
    if (!captureGlobalKeys) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        reset()
        return
      }
      const el = inputRef.current
      if (!el || document.activeElement === el || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Backspace') {
        e.preventDefault()
        el.focus()
        dispatch({ type: 'backspace', word: false })
      } else if (e.key.length === 1) {
        el.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [reset, captureGlobalKeys])

  return {
    block: state.blocks[state.blockIndex] as TextBlock | undefined,
    blockIndex: state.blockIndex,
    blockCount: state.blocks.length,
    target: state.target,
    typed: state.typed,
    status,
    stats,
    /** Wrong keystrokes in this session (for the error log). */
    errors: state.errors,
    /** Identifies the session; changes on every new attempt. */
    startedAt: state.startedAt,
    reset,
    inputRef,
    inputHandlers: { onKeyDown, onInput, onCompositionEnd },
  }
}

export type TypingEngine = ReturnType<typeof useTypingEngine>

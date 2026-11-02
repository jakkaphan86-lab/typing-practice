/**
 * Pure typing-engine state machine (no React). The hook in
 * `hooks/useTypingEngine.ts` wires it to `useReducer`.
 *
 * Input is tracked per code point (one keystroke each); rendering happens per
 * grapheme cluster elsewhere, so Thai marks never detach from their consonant.
 */
import type { TextBlock } from './blocks'

export type EngineStatus = 'idle' | 'running' | 'finished'

/** One wrong keystroke, kept for the error log. */
export interface KeystrokeError {
  expected: string
  typed: string
  timestamp: number
}

export interface EngineState {
  blocks: readonly TextBlock[]
  blockIndex: number
  /** Expected code points for the current block (may be reordered, see `canSwap`). */
  target: readonly string[]
  /** Code points typed in the current block. Cursor = typed.length. */
  typed: readonly string[]
  /** Cumulative over the whole session. Backspace never refunds keystrokes. */
  correctKeystrokes: number
  totalKeystrokes: number
  startedAt: number | null
  finishedAt: number | null
  errors: readonly KeystrokeError[]
}

export type EngineAction =
  | { type: 'type'; chars: readonly string[]; now: number }
  | { type: 'backspace'; word: boolean }
  | { type: 'reset'; blocks: readonly TextBlock[] }

export function createInitialState(blocks: readonly TextBlock[]): EngineState {
  return {
    blocks,
    blockIndex: 0,
    target: blocks[0]?.chars ?? [],
    typed: [],
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    startedAt: null,
    finishedAt: null,
    errors: [],
  }
}

export function getStatus(state: Pick<EngineState, 'startedAt' | 'finishedAt'>): EngineStatus {
  if (state.finishedAt !== null) return 'finished'
  return state.startedAt !== null ? 'running' : 'idle'
}

/** What a batch of keystrokes produced — drives feedback such as sound effects. */
export interface KeystrokeFeedback {
  correct: number
  incorrect: number
  /** A static block was completed (including the last one). */
  blockCompleted: boolean
  /** The whole session finished. */
  finished: boolean
}

/** Compare the state before and after a `type` action. */
export function describeKeystrokes(prev: EngineState, next: EngineState): KeystrokeFeedback {
  const typed = next.totalKeystrokes - prev.totalKeystrokes
  const correct = next.correctKeystrokes - prev.correctKeystrokes
  const finished = prev.finishedAt === null && next.finishedAt !== null
  return {
    correct,
    incorrect: typed - correct,
    blockCompleted: finished || next.blockIndex > prev.blockIndex,
    finished,
  }
}

/**
 * Thai tolerance: inside one grapheme cluster, the marks after the base
 * consonant can be typed in either order (e.g. "กิ่" as ก ิ ่ or ก ่ ิ, or
 * "ม่ำ" as ม ่ ำ or ม ำ ่). Both look identical on screen, so if the typed
 * code point is the *next* expected one in the same cluster, accept it and
 * swap the expected order instead of flagging an error.
 */
function canSwap(block: TextBlock, target: readonly string[], i: number, ch: string): boolean {
  const j = i + 1
  if (j >= target.length || target[j] !== ch) return false
  const cluster = block.charToCluster[i]
  if (cluster === undefined || cluster !== block.charToCluster[j]) return false
  const clusterStart = block.clusters[cluster]?.start ?? i
  return clusterStart < i
}

function typeChars(state: EngineState, chars: readonly string[], now: number): EngineState {
  if (state.finishedAt !== null || state.blocks.length === 0) return state

  let { blockIndex, correctKeystrokes, totalKeystrokes, startedAt } = state
  let finishedAt: number | null = null
  let target = state.target
  let typed = state.typed.slice()
  const newErrors: KeystrokeError[] = []

  for (const ch of chars) {
    if (finishedAt !== null) break
    if (ch === '\n' || ch === '\r') continue
    startedAt ??= now

    const i = typed.length
    const block = state.blocks[blockIndex]
    const next = target[i + 1]
    if (block && ch !== target[i] && next !== undefined && canSwap(block, target, i, ch)) {
      const swapped = target.slice() // copy-on-write: blocks' own arrays stay untouched
      swapped[i + 1] = swapped[i] as string
      swapped[i] = next
      target = swapped
    }

    const expected = target[i] ?? ''
    totalKeystrokes++
    if (ch === expected) correctKeystrokes++
    else newErrors.push({ expected, typed: ch, timestamp: now })
    typed.push(ch)

    // Block complete → swap in the next static block (or finish).
    if (typed.length >= target.length) {
      const nextBlock = state.blocks[blockIndex + 1]
      if (nextBlock) {
        blockIndex++
        target = nextBlock.chars
        typed = []
      } else {
        finishedAt = now
      }
    }
  }

  // Nothing typed (e.g. only line breaks) → same state, so React skips the render.
  if (totalKeystrokes === state.totalKeystrokes) return state

  return {
    ...state,
    blockIndex,
    target,
    typed,
    correctKeystrokes,
    totalKeystrokes,
    startedAt,
    finishedAt,
    errors: newErrors.length > 0 ? [...state.errors, ...newErrors] : state.errors,
  }
}

function backspace(state: EngineState, word: boolean): EngineState {
  // Backspace is limited to the current block: finished blocks are gone.
  if (state.finishedAt !== null || state.typed.length === 0) return state
  let n = state.typed.length
  if (word) {
    while (n > 0 && state.target[n - 1] === ' ') n--
    while (n > 0 && state.target[n - 1] !== ' ') n--
  } else {
    n--
  }
  return { ...state, typed: state.typed.slice(0, n) }
}

export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'reset':
      return createInitialState(action.blocks)
    case 'type':
      return typeChars(state, action.chars, action.now)
    case 'backspace':
      return backspace(state, action.word)
  }
}

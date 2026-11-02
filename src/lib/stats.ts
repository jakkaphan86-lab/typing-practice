/** Standard typing-test convention: 5 keystrokes (spaces included) = 1 word. */
const KEYSTROKES_PER_WORD = 5

/** Words per minute from a keystroke count and elapsed milliseconds. */
function calcWpm(keystrokes: number, elapsedMs: number): number {
  if (keystrokes === 0 || elapsedMs <= 0) return 0
  return keystrokes / KEYSTROKES_PER_WORD / (elapsedMs / 60_000)
}

/** Accuracy = correct keystrokes / total keystrokes × 100 (100 before any input). */
function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 100
  return (correct / total) * 100
}

/** The raw counters a session accumulates; everything else is derived. */
export interface SessionCounters {
  startedAt: number | null
  correctKeystrokes: number
  totalKeystrokes: number
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

/** Derive WPM/accuracy for a session as of `nowMs`. */
export function computeStats(counters: SessionCounters, nowMs: number): TypingStats {
  const { startedAt, correctKeystrokes, totalKeystrokes } = counters
  const elapsedMs = startedAt === null ? 0 : Math.max(0, nowMs - startedAt)
  return {
    wpm: calcWpm(correctKeystrokes, elapsedMs),
    rawWpm: calcWpm(totalKeystrokes, elapsedMs),
    accuracy: calcAccuracy(correctKeystrokes, totalKeystrokes),
    elapsedMs,
    correctKeystrokes,
    totalKeystrokes,
  }
}

/** Standard typing-test convention: 5 keystrokes (spaces included) = 1 word. */
export const KEYSTROKES_PER_WORD = 5

/** Words per minute from a keystroke count and elapsed milliseconds. */
export function calcWpm(keystrokes: number, elapsedMs: number): number {
  if (keystrokes === 0 || elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60_000
  return keystrokes / KEYSTROKES_PER_WORD / minutes
}

/** Accuracy = correct keystrokes / total keystrokes × 100 (100 before any input). */
export function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 100
  return (correct / total) * 100
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

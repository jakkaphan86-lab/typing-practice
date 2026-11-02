import { memo } from 'react'
import type { WordInfo } from '../../lib/blocks'

type ClusterState = 'pending' | 'correct' | 'incorrect' | 'partial'

const STATE_CLASSES: Record<ClusterState, string> = {
  pending: 'text-slate-400 dark:text-slate-500',
  partial: 'text-slate-700 dark:text-slate-200',
  correct: 'text-emerald-700/80 dark:text-emerald-400/80',
  incorrect: 'rounded-sm bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
}

/**
 * A cluster (visible character) may span several typed code points (Thai
 * consonant + vowel + tone mark). It is correct only when every code point is.
 * Offsets are relative to the word.
 */
function getClusterState(start: number, end: number, expected: readonly string[], typed: readonly string[]): ClusterState {
  if (typed.length <= start) return 'pending'
  for (let i = start; i < Math.min(typed.length, end); i++) {
    if (typed[i] !== expected[i]) return 'incorrect'
  }
  return typed.length < end ? 'partial' : 'correct'
}

interface WordViewProps {
  word: WordInfo
  /** Expected code points of this word, joined (may be reordered by the Thai mark tolerance). */
  expected: string
  /** What has been typed of this word so far, joined. */
  typed: string
  /** Caret offset within the word (code points), or -1 when the caret is elsewhere. */
  caret: number
  isCurrent: boolean
}

/**
 * One word of the block. Memoised on primitive props, so a keystroke only
 * re-renders the word(s) whose typed text or caret actually changed.
 */
export const WordView = memo(function WordView({ word, expected, typed, caret, isCurrent }: WordViewProps) {
  const expectedChars = Array.from(expected)
  const typedChars = Array.from(typed)
  return (
    <span className={isCurrent ? 'rounded-md bg-slate-100 py-1 transition-colors dark:bg-slate-800/80' : undefined}>
      {word.clusters.map((c) => {
        const start = c.start - word.start
        const end = c.end - word.start
        const hasCaret = caret >= start && caret < end
        return (
          <span key={c.index} className={`relative ${STATE_CLASSES[getClusterState(start, end, expectedChars, typedChars)]}`}>
            {hasCaret && (
              <span
                key={caret /* restart the blink on every keystroke */}
                aria-hidden
                className={`pointer-events-none absolute top-[22%] bottom-[22%] w-0.5 animate-blink rounded-full bg-amber-500 ${
                  caret === start ? '-left-px' : '-right-px'
                }`}
              />
            )}
            {/* Always the canonical spelling, even if marks were typed in another order. */}
            {c.text}
          </span>
        )
      })}
    </span>
  )
})

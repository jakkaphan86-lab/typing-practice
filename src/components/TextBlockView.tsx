import { memo } from 'react'
import type { ClusterInfo, TextBlock } from '../lib/blocks'

type ClusterState = 'pending' | 'correct' | 'incorrect' | 'partial'

/**
 * A cluster (visible character) may span several typed code points (Thai
 * consonant + vowel + tone mark). It is correct only when every code point is.
 */
function getClusterState(c: ClusterInfo, target: string[], typed: string[]): ClusterState {
  if (typed.length <= c.start) return 'pending'
  const upto = Math.min(typed.length, c.end)
  for (let i = c.start; i < upto; i++) {
    if (typed[i] !== target[i]) return 'incorrect'
  }
  return typed.length < c.end ? 'partial' : 'correct'
}

const STATE_CLASSES: Record<ClusterState, string> = {
  pending: 'text-slate-400 dark:text-slate-500',
  partial: 'text-slate-700 dark:text-slate-200',
  correct: 'text-emerald-700/80 dark:text-emerald-400/80',
  incorrect: 'rounded-sm bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
}

interface Props {
  block: TextBlock
  target: string[]
  typed: string[]
  linesPerBlock: number
  lang: string
}

function TextBlockViewImpl({ block, target, typed, linesPerBlock, lang }: Props) {
  const cursor = typed.length
  const cursorCluster = block.charToCluster[cursor] ?? -1

  // Current word = word under the cursor; if the cursor sits on a space or
  // punctuation, highlight the upcoming word instead.
  let currentWord = cursorCluster >= 0 ? block.clusterToWord[cursorCluster] : -1
  while (currentWord >= 0 && currentWord < block.words.length && !block.words[currentWord].wordLike) {
    currentWord++
  }

  return (
    <div
      lang={lang}
      className="select-none"
      // Reserve space for a full block so the layout never jumps.
      style={{ minHeight: `${linesPerBlock * 2.4}em` }}
    >
      {block.lines.map((line, li) => (
        <div key={li} className="whitespace-pre-wrap break-words">
          {line.words.map((word) => (
            <span
              key={word.id}
              className={
                word.id === currentWord
                  ? 'rounded-md bg-slate-100 py-1 transition-colors dark:bg-slate-800/80'
                  : undefined
              }
            >
              {word.clusters.map((c) => {
                const state = getClusterState(c, target, typed)
                const hasCaret = cursor >= c.start && cursor < c.end
                return (
                  <span key={c.index} className={`relative ${STATE_CLASSES[state]}`}>
                    {hasCaret && (
                      <span
                        key={cursor /* restart blink on every keystroke */}
                        aria-hidden
                        className={`pointer-events-none absolute top-[22%] bottom-[22%] w-0.5 animate-blink rounded-full bg-amber-500 ${
                          cursor === c.start ? '-left-px' : '-right-px'
                        }`}
                      />
                    )}
                    {/* Always show the canonical spelling, even if marks were typed in another order. */}
                    {c.text}
                  </span>
                )
              })}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export const TextBlockView = memo(TextBlockViewImpl)

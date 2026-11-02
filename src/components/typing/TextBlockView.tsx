import { memo } from 'react'
import { findCurrentWordId, type TextBlock } from '../../lib/blocks'
import { WordView } from './WordView'

interface TextBlockViewProps {
  block: TextBlock
  target: readonly string[]
  typed: readonly string[]
  linesPerBlock: number
  lang: string
}

/** Renders one static block, line by line, with per-word memoised rendering. */
export const TextBlockView = memo(function TextBlockView({
  block,
  target,
  typed,
  linesPerBlock,
  lang,
}: TextBlockViewProps) {
  const cursor = typed.length
  const currentWordId = findCurrentWordId(block, cursor)

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
            <WordView
              key={word.id}
              word={word}
              expected={target.slice(word.start, word.end).join('')}
              typed={cursor > word.start ? typed.slice(word.start, Math.min(cursor, word.end)).join('') : ''}
              caret={cursor >= word.start && cursor < word.end ? cursor - word.start : -1}
              isCurrent={word.id === currentWordId}
            />
          ))}
        </div>
      ))}
    </div>
  )
})

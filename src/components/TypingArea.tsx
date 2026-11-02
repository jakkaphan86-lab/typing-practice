import { MousePointerClick } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SAMPLE_TEXTS } from '../data/sampleTexts'
import { useLineMetrics } from '../hooks/useLineMetrics'
import { useTypingEngine } from '../hooks/useTypingEngine'
import { useSettingsStore } from '../store/useSettingsStore'
import { ResultCard } from './ResultCard'
import { StatsBar } from './StatsBar'
import { TextBlockView } from './TextBlockView'

const LINES_PER_BLOCK = 3

export function TypingArea() {
  const language = useSettingsStore((s) => s.language)
  const showStats = useSettingsStore((s) => s.showStats)
  const textRef = useRef<HTMLDivElement>(null)
  const metrics = useLineMetrics(textRef)

  const engine = useTypingEngine(SAMPLE_TEXTS[language].text, {
    locale: language,
    linesPerBlock: LINES_PER_BLOCK,
    // Character-count fallback until the container has been measured (pre-paint).
    maxLineWidth: metrics?.maxLineWidth ?? 40,
    measure: metrics?.measure,
  })
  const { inputRef } = engine

  const [focused, setFocused] = useState(false)

  // Focus on mount and whenever the passage changes.
  useEffect(() => {
    inputRef.current?.focus()
  }, [language, inputRef])

  return (
    <section className="w-full max-w-3xl" aria-label="Typing practice">
      {/* Fixed-height slot so toggling stats never shifts the text. */}
      <div className="mb-8 flex h-9 items-end">
        {showStats && engine.status !== 'finished' && (
          <StatsBar stats={engine.stats} blockIndex={engine.blockIndex} blockCount={engine.blockCount} />
        )}
      </div>

      {/* Hidden input: captures keystrokes (incl. Thai keyboard & IME) without a visible textarea. */}
      <input
        ref={inputRef}
        {...engine.inputHandlers}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        type="text"
        aria-label="Typing input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="pointer-events-none absolute size-px opacity-0"
      />

      {engine.status === 'finished' && <ResultCard stats={engine.stats} onRestart={engine.reset} />}

      {/* Always mounted (it is the measured element); hidden once finished. */}
      <div
        ref={textRef}
        hidden={engine.status === 'finished'}
        className="relative cursor-text text-xl leading-[2.4] sm:text-2xl"
        onClick={() => inputRef.current?.focus()}
      >
        <div className={`transition-[filter,opacity] duration-200 ${focused ? '' : 'opacity-40 blur-[3px]'}`}>
          {engine.block && (
            <TextBlockView
              // Remount per block → the new block simply replaces the old one.
              key={engine.blockIndex}
              block={engine.block}
              target={engine.target}
              typed={engine.typed}
              linesPerBlock={LINES_PER_BLOCK}
              lang={language}
            />
          )}
        </div>
        {!focused && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-base text-slate-600 dark:text-slate-300">
            <MousePointerClick className="size-5" aria-hidden />
            <span>Click here or start typing to focus</span>
          </div>
        )}
      </div>
    </section>
  )
}

import { BookOpen, MousePointerClick } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useActiveText } from '../hooks/useActiveText'
import { useLineMetrics } from '../hooks/useLineMetrics'
import { useSessionRecorder } from '../hooks/useSessionRecorder'
import { useTypingEngine } from '../hooks/useTypingEngine'
import { useSettingsStore } from '../store/useSettingsStore'
import { ResultScreen } from './ResultScreen'
import { StatsBar } from './StatsBar'
import { TextBlockView } from './TextBlockView'

const LINES_PER_BLOCK = 3

export function TypingArea() {
  const showStats = useSettingsStore((s) => s.showStats)
  const isDrawerOpen = useSettingsStore((s) => s.drawerTab !== null)
  const openDrawer = useSettingsStore((s) => s.openDrawer)
  // Selected custom text from Dexie, or the built-in sample as a fallback.
  const activeText = useActiveText()
  const language = activeText?.language ?? 'en'
  const textRef = useRef<HTMLDivElement>(null)
  const metrics = useLineMetrics(textRef)

  const engine = useTypingEngine(activeText?.content ?? '', {
    locale: language,
    linesPerBlock: LINES_PER_BLOCK,
    // Character-count fallback until the container has been measured (pre-paint).
    maxLineWidth: metrics?.maxLineWidth ?? 40,
    measure: metrics?.measure,
    // Let the library drawer's form fields receive keystrokes while it's open.
    captureGlobalKeys: !isDrawerOpen,
  })
  const { inputRef } = engine
  const save = useSessionRecorder(engine, activeText?.id ?? null)

  const [focused, setFocused] = useState(false)

  // Focus on mount, when the passage changes, and when the library closes.
  const textKey = activeText?.id
  useEffect(() => {
    if (!isDrawerOpen) inputRef.current?.focus()
  }, [textKey, isDrawerOpen, inputRef])

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

      {engine.status === 'finished' && (
        <ResultScreen stats={engine.stats} save={save} errors={engine.errors} onRestart={engine.reset} />
      )}

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

      {activeText && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openDrawer('texts')}
          title="Choose another text"
          className="mx-auto mt-10 flex max-w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-300"
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          <span lang={activeText.language} className="truncate">
            {activeText.title}
          </span>
        </button>
      )}
    </section>
  )
}

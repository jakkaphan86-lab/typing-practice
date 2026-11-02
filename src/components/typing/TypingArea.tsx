import { useCallback } from 'react'
import { LINES_PER_BLOCK, useTypingSession } from '../../hooks/useTypingSession'
import { useSettingsStore } from '../../store/useSettingsStore'
import { ResultScreen } from '../results/ResultScreen'
import { ActiveTextButton } from './ActiveTextButton'
import { HiddenTypingInput } from './HiddenTypingInput'
import { LiveStatsBar } from './LiveStatsBar'
import { TextBlockView } from './TextBlockView'
import { TypingBoard } from './TypingBoard'

/** The typing screen: live stats, the static text block (or results), and the active text. */
export function TypingArea() {
  const showStats = useSettingsStore((s) => s.showStats)
  const openDrawer = useSettingsStore((s) => s.openDrawer)
  const { activeText, language, textRef, engine, input, save } = useTypingSession()
  const { inputRef, inputProps, isFocused, focus, restart } = input

  const openLibrary = useCallback(() => openDrawer('texts'), [openDrawer])
  const openStats = useCallback(() => openDrawer('stats'), [openDrawer])
  const finished = engine.status === 'finished'

  return (
    <section className="w-full max-w-3xl" aria-label="Typing practice">
      {/* Fixed-height slot so toggling stats never shifts the text. */}
      <div className="mb-8 flex h-9 items-end">
        {showStats && !finished && (
          <LiveStatsBar
            counters={engine.counters}
            running={engine.status === 'running'}
            blockIndex={engine.blockIndex}
            blockCount={engine.blockCount}
          />
        )}
      </div>

      <HiddenTypingInput ref={inputRef} {...inputProps} />

      {finished && engine.finalStats && (
        <ResultScreen
          stats={engine.finalStats}
          save={save}
          errors={engine.errors}
          onRestart={restart}
          onOpenStats={openStats}
        />
      )}

      <TypingBoard ref={textRef} hidden={finished} focused={isFocused} onFocusRequest={focus}>
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
      </TypingBoard>

      {activeText && <ActiveTextButton title={activeText.title} lang={activeText.language} onClick={openLibrary} />}
    </section>
  )
}

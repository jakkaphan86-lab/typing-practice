import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useActiveText } from './useActiveText'
import { useLineMetrics } from './useLineMetrics'
import { useSessionRecorder } from './useSessionRecorder'
import { useTypingEngine } from './useTypingEngine'
import { useTypingInput } from './useTypingInput'
import { useTypingSounds } from './useTypingSounds'

/** Lines shown per static block. */
export const LINES_PER_BLOCK = 3
/** Characters per line until the text container has been measured (pre-paint). */
const FALLBACK_CHARS_PER_LINE = 40

/**
 * Everything the typing screen needs, composed in one place: the active text,
 * measured line layout, engine, keystroke capture, sound feedback, session
 * recording and focus.
 */
export function useTypingSession() {
  const isDrawerOpen = useSettingsStore((s) => s.drawerTab !== null)
  const activeText = useActiveText()
  const language = activeText?.language ?? 'en'

  const textRef = useRef<HTMLDivElement>(null)
  const metrics = useLineMetrics(textRef)
  const playFeedback = useTypingSounds()

  const engine = useTypingEngine(activeText?.content ?? '', {
    locale: language,
    linesPerBlock: LINES_PER_BLOCK,
    maxLineWidth: metrics?.maxLineWidth ?? FALLBACK_CHARS_PER_LINE,
    measure: metrics?.measure,
    onFeedback: playFeedback,
  })

  const input = useTypingInput({
    onType: engine.typeChars,
    onBackspace: engine.backspace,
    onRestart: engine.reset,
    // Let the drawer's form fields receive keystrokes while it's open.
    captureGlobalKeys: !isDrawerOpen,
  })

  const save = useSessionRecorder(engine, activeText?.id ?? null)

  // Focus the input when a passage is shown and whenever the drawer closes.
  const textId = activeText?.id
  const { focus } = input
  useEffect(() => {
    if (!isDrawerOpen && textId !== undefined) focus()
  }, [textId, isDrawerOpen, focus])

  return { activeText, language, textRef, engine, input, save }
}

import { memo, type Ref } from 'react'
import type { HiddenInputProps } from '../../hooks/useTypingInput'

interface HiddenTypingInputProps extends HiddenInputProps {
  ref: Ref<HTMLInputElement>
}

/**
 * Invisible input that receives keystrokes (incl. Thai keyboards & IME) — no
 * visible textarea. Memoised: its ref and handlers are stable across keystrokes.
 */
export const HiddenTypingInput = memo(function HiddenTypingInput({ ref, ...handlers }: HiddenTypingInputProps) {
  return (
    <input
      ref={ref}
      {...handlers}
      type="text"
      aria-label="Typing input"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      className="pointer-events-none absolute size-px opacity-0"
    />
  )
})

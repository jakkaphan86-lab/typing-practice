import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react'

interface TypingInputOptions {
  onType: (chars: readonly string[]) => void
  onBackspace: (word: boolean) => void
  onRestart: () => void
  /**
   * When false, the global key listener is detached (e.g. while a dialog with
   * its own form fields is open) so keystrokes are not stolen.
   */
  captureGlobalKeys: boolean
}

/** Props for the hidden `<input>` that receives keystrokes. */
export interface HiddenInputProps {
  onKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void
  onInput: (e: FormEvent<HTMLInputElement>) => void
  onCompositionEnd: () => void
  onFocus: () => void
  onBlur: () => void
}

export interface TypingInput {
  inputRef: RefObject<HTMLInputElement | null>
  inputProps: HiddenInputProps
  isFocused: boolean
  focus: () => void
  /** Restart the session and put focus back on the input. */
  restart: () => void
}

/**
 * Captures keystrokes through a hidden `<input>` (handles Thai keyboards and
 * IME composition) plus a global listener: Escape restarts, and any typing key
 * while the input is unfocused focuses it first so the keystroke isn't lost.
 */
export function useTypingInput({ onType, onBackspace, onRestart, captureGlobalKeys }: TypingInputOptions): TypingInput {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setFocused] = useState(false)

  const focus = useCallback(() => inputRef.current?.focus(), [])
  const restart = useCallback(() => {
    onRestart()
    focus()
  }, [onRestart, focus])

  /** Move whatever the browser inserted into the hidden input into the engine. */
  const flush = useCallback(() => {
    const el = inputRef.current
    if (!el?.value) return
    const chars = Array.from(el.value.normalize('NFC'))
    el.value = ''
    onType(chars)
  }, [onType])

  const inputProps = useMemo<HiddenInputProps>(
    () => ({
      onKeyDown: (e) => {
        if (e.key === 'Backspace') {
          e.preventDefault()
          onBackspace(e.ctrlKey || e.altKey || e.metaKey)
        } else if (e.key === 'Tab' || e.key === 'Enter') {
          e.preventDefault()
        }
      },
      // Wait for IME composition to finish; compositionend flushes.
      onInput: (e) => {
        if (!(e.nativeEvent as InputEvent).isComposing) flush()
      },
      onCompositionEnd: flush,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    }),
    [flush, onBackspace],
  )

  useEffect(() => {
    if (!captureGlobalKeys) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        restart()
        return
      }
      const el = inputRef.current
      if (!el || document.activeElement === el || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Backspace') {
        e.preventDefault()
        el.focus()
        onBackspace(false)
      } else if (e.key.length === 1) {
        el.focus() // the browser then delivers this keystroke to the input
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [captureGlobalKeys, restart, onBackspace])

  return { inputRef, inputProps, isFocused, focus, restart }
}

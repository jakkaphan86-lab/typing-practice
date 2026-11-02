import { useEffect, type RefObject } from 'react'

/**
 * Modal dialog behaviour: Escape closes it, focus moves into the dialog on
 * open, and the page behind it doesn't scroll while it is mounted.
 */
export function useDialog(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    ref.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
    }
  }, [ref, onClose])
}

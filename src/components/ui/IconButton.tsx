import type { ReactNode } from 'react'
import { preventFocusSteal } from '../../utils/dom'

type Tone = 'toolbar' | 'muted' | 'danger'

interface IconButtonProps {
  /** Accessible name; also shown as the tooltip. */
  label: string
  onClick: () => void
  children: ReactNode
  /** Toggle buttons: renders `aria-pressed` and an active colour. */
  pressed?: boolean
  size?: 'sm' | 'md'
  tone?: Tone
  /** Keep focus on the hidden typing input when clicked with the mouse. */
  preserveFocus?: boolean
}

const TONE: Record<Tone, string> = {
  toolbar: 'text-slate-500 dark:text-slate-400',
  muted: 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
  danger: 'text-slate-400 hover:text-red-600 dark:hover:text-red-400',
}

function toneClass(tone: Tone, pressed: boolean | undefined): string {
  if (pressed === true) return 'text-amber-600 dark:text-amber-400'
  if (pressed === false) return 'text-slate-400 dark:text-slate-500'
  return TONE[tone]
}

export function IconButton({
  label,
  onClick,
  children,
  pressed,
  size = 'md',
  tone = 'toolbar',
  preserveFocus = false,
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={preserveFocus ? preventFocusSteal : undefined}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:hover:bg-slate-800 ${
        size === 'md' ? 'size-9' : 'size-8'
      } ${toneClass(tone, pressed)}`}
    >
      {children}
    </button>
  )
}

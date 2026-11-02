import type { LucideIcon } from 'lucide-react'
import { preventFocusSteal } from '../../utils/dom'

interface GhostButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  /** Keep focus on the hidden typing input when clicked with the mouse. */
  preserveFocus?: boolean
}

/** Low-emphasis text button with a leading icon. */
export function GhostButton({ icon: Icon, label, onClick, preserveFocus = false }: GhostButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={preserveFocus ? preventFocusSteal : undefined}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  )
}

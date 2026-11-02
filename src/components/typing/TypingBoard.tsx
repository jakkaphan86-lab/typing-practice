import { MousePointerClick } from 'lucide-react'
import type { ReactNode, Ref } from 'react'

interface TypingBoardProps {
  /** The measured text container (see `useLineMetrics`). */
  ref: Ref<HTMLDivElement>
  hidden: boolean
  focused: boolean
  onFocusRequest: () => void
  children: ReactNode
}

/**
 * Frame around the text block: sets the text size used for measuring, and
 * blurs the text with a "click to focus" hint while input isn't focused.
 * Stays mounted when hidden so it can keep being measured.
 */
export function TypingBoard({ ref, hidden, focused, onFocusRequest, children }: TypingBoardProps) {
  return (
    <div
      ref={ref}
      hidden={hidden}
      className="relative cursor-text text-xl leading-[2.4] sm:text-2xl"
      onClick={onFocusRequest}
    >
      <div className={`transition-[filter,opacity] duration-200 ${focused ? '' : 'opacity-40 blur-[3px]'}`}>
        {children}
      </div>
      {!focused && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-base text-slate-600 dark:text-slate-300">
          <MousePointerClick className="size-5" aria-hidden />
          <span>Click here or start typing to focus</span>
        </div>
      )}
    </div>
  )
}

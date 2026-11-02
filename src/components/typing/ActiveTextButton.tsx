import { BookOpen } from 'lucide-react'
import { memo } from 'react'
import { preventFocusSteal } from '../../utils/dom'

interface ActiveTextButtonProps {
  title: string
  lang: string
  onClick: () => void
}

/** Shows which text is being practised; opens the library to choose another. */
export const ActiveTextButton = memo(function ActiveTextButton({ title, lang, onClick }: ActiveTextButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={preventFocusSteal}
      onClick={onClick}
      title="Choose another text"
      className="mx-auto mt-10 flex max-w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-300"
    >
      <BookOpen className="size-4 shrink-0" aria-hidden />
      <span lang={lang} className="truncate">
        {title}
      </span>
    </button>
  )
})

import type { Language } from '../../lib/types'

export function LanguageBadge({ language }: { language: Language }) {
  return (
    <span className="shrink-0 rounded border border-slate-200 px-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {language}
    </span>
  )
}

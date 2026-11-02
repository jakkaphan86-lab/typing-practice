import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface SectionHeadingProps {
  id: string
  icon: LucideIcon
  iconClassName: string
  children: ReactNode
  /** Optional muted note on the right. */
  aside?: ReactNode
}

export function SectionHeading({ id, icon: Icon, iconClassName, children, aside }: SectionHeadingProps) {
  return (
    <div className="flex items-baseline justify-between">
      <h3 id={id} className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Icon className={`size-4 ${iconClassName}`} aria-hidden />
        {children}
      </h3>
      {aside && <span className="text-xs text-slate-400 dark:text-slate-500">{aside}</span>}
    </div>
  )
}

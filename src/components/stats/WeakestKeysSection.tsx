import { Crosshair } from 'lucide-react'
import { describeChar, type MissedChar } from '../../lib/analytics'
import { plural } from '../../utils/format'
import { KeyCap } from '../ui/KeyCap'
import { SectionHeading } from './SectionHeading'

interface WeakestKeysSectionProps {
  keys: readonly MissedChar[]
  totalErrors: number
  sessions: number
}

/** Most frequently missed characters across all sessions, as relative bars. */
export function WeakestKeysSection({ keys, totalErrors, sessions }: WeakestKeysSectionProps) {
  const maxCount = keys[0]?.count ?? 1

  return (
    <section aria-labelledby="weakest-keys" className="flex flex-col gap-3">
      <SectionHeading id="weakest-keys" icon={Crosshair} iconClassName="text-red-500 dark:text-red-400">
        Weakest keys
      </SectionHeading>

      {keys.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
          No missed keys recorded. Impressive!
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {keys.map((k) => (
            <WeakKeyRow key={k.char} missed={k} maxCount={maxCount} />
          ))}
        </ol>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {totalErrors.toLocaleString()} missed keystroke{plural(totalErrors)} across {sessions} session{plural(sessions)}
      </p>
    </section>
  )
}

function WeakKeyRow({ missed, maxCount }: { missed: MissedChar; maxCount: number }) {
  const { name } = describeChar(missed.char)
  const typedAs = missed.typedAs ? describeChar(missed.typedAs).glyph : null
  return (
    <li className="flex items-center gap-3">
      <KeyCap char={missed.char} size="sm" tone="error" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="truncate text-slate-500 dark:text-slate-400" lang="th">
            {name && <span className="mr-1.5 text-slate-600 dark:text-slate-300">{name}</span>}
            {typedAs && <>often typed as “{typedAs}”</>}
          </span>
          <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
            {missed.count}× · {Math.round(missed.share * 100)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-red-400/80 dark:bg-red-400/70"
            style={{ width: `${(missed.count / maxCount) * 100}%` }}
          />
        </div>
      </div>
    </li>
  )
}

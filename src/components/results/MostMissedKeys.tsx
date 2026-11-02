import { CircleCheck, Crosshair } from 'lucide-react'
import type { MissedChar } from '../../lib/analytics'
import { KeyCap } from '../ui/KeyCap'

/**
 * The session's top missed characters, or a "clean run" note. Renders an empty
 * fixed-height slot while `misses` is still loading, so the layout doesn't jump.
 */
export function MostMissedKeys({ misses }: { misses: readonly MissedChar[] | undefined }) {
  return (
    <div className="flex min-h-[5.5rem] flex-col items-center justify-center gap-3">
      {misses && misses.length > 0 && (
        <>
          <h3 className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Crosshair className="size-4" aria-hidden />
            Most missed
          </h3>
          <ol className="flex items-start gap-5">
            {misses.map((m) => (
              <li key={m.char} className="flex flex-col items-center gap-1">
                <KeyCap char={m.char} tone="error" />
                <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">×{m.count}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      {misses?.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CircleCheck className="size-4" aria-hidden />
          No missed keys. Clean run!
        </p>
      )}
    </div>
  )
}

import { Dumbbell, LoaderCircle } from 'lucide-react'
import { useWeakKeysDrill } from '../../hooks/useWeakKeysDrill'
import { KeyCap } from '../ui/KeyCap'

/** Weakest keys, most-missed first. Empty → button disabled. */
export function PracticeWeakKeysButton({ weakKeys }: { weakKeys: readonly string[] }) {
  const drill = useWeakKeysDrill(weakKeys)
  const languageName = drill.language === 'th' ? 'Thai' : 'English'

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={drill.start}
        disabled={drill.disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:text-slate-950 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
      >
        {drill.busy ? (
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
        ) : (
          <Dumbbell className="size-5" aria-hidden />
        )}
        Practice weak keys
      </button>

      {weakKeys.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">No missed keys yet. Finish a few sessions first.</p>
      ) : drill.targets.length > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {languageName} drill targeting
          {drill.targets.map((k) => (
            <KeyCap key={k} char={k} size="xs" tone="error" />
          ))}
        </p>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500">Mixed {languageName} drill</p>
      )}

      {drill.error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {drill.error}
        </p>
      )}
    </div>
  )
}

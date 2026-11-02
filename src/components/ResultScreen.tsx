import { ChartColumn, CircleCheck, Crosshair, RotateCcw } from 'lucide-react'
import { useMemo, type MouseEvent } from 'react'
import { useSessionMisses } from '../hooks/useAnalytics'
import type { SaveState, SaveStatus } from '../hooks/useSessionRecorder'
import type { KeystrokeError, TypingStats } from '../hooks/useTypingEngine'
import { rankMissedChars, type MissedChar } from '../lib/analytics'
import { formatDuration } from '../lib/stats'
import { useSettingsStore } from '../store/useSettingsStore'
import { KeyCap } from './stats/KeyCap'

interface Props {
  stats: TypingStats
  save: SaveState | null
  /** In-memory errors; only used if the session could not be saved. */
  errors: KeystrokeError[]
  onRestart: () => void
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  saving: 'Saving…',
  saved: 'Saved to history',
  error: 'Could not save to history',
}

const keepFocus = (e: MouseEvent) => e.preventDefault()

export function ResultScreen({ stats, save, errors, onRestart }: Props) {
  const openDrawer = useSettingsStore((s) => s.openDrawer)

  // Source of truth: this session's rows in `errorLogs`.
  const stored = useSessionMisses(save?.status === 'saved' ? save.sessionId : null, 3)
  const fallback = useMemo(
    () =>
      rankMissedChars(
        errors.map((e) => ({ expectedChar: e.expected, typedChar: e.typed })),
        3,
      ),
    [errors],
  )
  const misses: MissedChar[] | undefined =
    save?.status === 'saved' ? stored : save?.status === 'error' ? fallback : undefined

  const items = [
    { label: 'wpm', value: Math.round(stats.wpm) },
    { label: 'accuracy', value: `${Math.floor(stats.accuracy)}%` },
    { label: 'time', value: formatDuration(stats.elapsedMs) },
  ]

  return (
    <div className="flex flex-col items-center gap-10 py-2">
      <dl className="grid grid-cols-3 gap-8 text-center sm:gap-16">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-slate-500 dark:text-slate-400">{item.label}</dt>
            <dd className="text-4xl font-semibold tabular-nums text-amber-600 dark:text-amber-400 sm:text-5xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Fixed height so the layout doesn't jump while the query resolves. */}
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
        {misses && misses.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CircleCheck className="size-4" aria-hidden />
            No missed keys. Clean run!
          </p>
        )}
      </div>

      <p className="text-sm text-slate-400 dark:text-slate-500">
        raw {Math.round(stats.rawWpm)} wpm · {stats.correctKeystrokes}/{stats.totalKeystrokes} keystrokes
        {save && (
          <span className={save.status === 'error' ? 'text-red-500' : undefined}> · {SAVE_LABEL[save.status]}</span>
        )}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RotateCcw className="size-4" aria-hidden />
          Restart
        </button>
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => openDrawer('stats')}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChartColumn className="size-4" aria-hidden />
          My stats
        </button>
      </div>
    </div>
  )
}

import { RotateCcw } from 'lucide-react'
import type { SaveStatus } from '../hooks/useSessionRecorder'
import type { TypingStats } from '../hooks/useTypingEngine'
import { formatDuration } from '../lib/stats'

interface Props {
  stats: TypingStats
  saveStatus: SaveStatus | null
  onRestart: () => void
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  saving: 'Saving…',
  saved: 'Saved to history',
  error: 'Could not save to history',
}

export function ResultCard({ stats, saveStatus, onRestart }: Props) {
  const items = [
    { label: 'wpm', value: Math.round(stats.wpm) },
    { label: 'accuracy', value: `${Math.floor(stats.accuracy)}%` },
    { label: 'time', value: formatDuration(stats.elapsedMs) },
  ]

  return (
    <div className="flex flex-col items-center gap-10 py-6">
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
      <p className="text-sm text-slate-400 dark:text-slate-500">
        raw {Math.round(stats.rawWpm)} wpm · {stats.correctKeystrokes}/{stats.totalKeystrokes} keystrokes
        {saveStatus && (
          <span className={saveStatus === 'error' ? 'text-red-500' : undefined}> · {SAVE_LABEL[saveStatus]}</span>
        )}
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <RotateCcw className="size-4" aria-hidden />
        Restart
      </button>
    </div>
  )
}

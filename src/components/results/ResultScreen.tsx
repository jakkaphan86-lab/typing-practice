import { ChartColumn, RotateCcw } from 'lucide-react'
import { useResultMisses } from '../../hooks/useAnalytics'
import type { SaveState, SaveStatus } from '../../hooks/useSessionRecorder'
import type { TypingStats } from '../../lib/stats'
import type { KeystrokeError } from '../../lib/typingEngine'
import { GhostButton } from '../ui/GhostButton'
import { MostMissedKeys } from './MostMissedKeys'
import { ResultSummary } from './ResultSummary'

interface ResultScreenProps {
  stats: TypingStats
  save: SaveState | null
  /** In-memory errors; only used if the session could not be saved. */
  errors: readonly KeystrokeError[]
  onRestart: () => void
  onOpenStats: () => void
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  saving: 'Saving…',
  saved: 'Saved to history',
  error: 'Could not save to history',
}

/** Post-session results: headline numbers, most-missed keys, save status and actions. */
export function ResultScreen({ stats, save, errors, onRestart, onOpenStats }: ResultScreenProps) {
  const misses = useResultMisses(save, errors)

  return (
    <div className="flex flex-col items-center gap-10 py-2">
      <ResultSummary stats={stats} />
      <MostMissedKeys misses={misses} />

      <p className="text-sm text-slate-400 dark:text-slate-500">
        raw {Math.round(stats.rawWpm)} wpm · {stats.correctKeystrokes}/{stats.totalKeystrokes} keystrokes
        {save && (
          <span className={save.status === 'error' ? 'text-red-500' : undefined}> · {SAVE_LABEL[save.status]}</span>
        )}
      </p>

      <div className="flex items-center gap-2">
        <GhostButton icon={RotateCcw} label="Restart" onClick={onRestart} preserveFocus />
        <GhostButton icon={ChartColumn} label="My stats" onClick={onOpenStats} preserveFocus />
      </div>
    </div>
  )
}

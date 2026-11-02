import { Dumbbell, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { saveWeakKeysDrill } from '../../lib/db'
import { focusKeysFor, generateDrill, pickDrillLanguage } from '../../lib/drill'
import { useSettingsStore } from '../../store/useSettingsStore'
import { KeyCap } from './KeyCap'

interface Props {
  /** Weakest keys, most-missed first. Empty → button disabled. */
  weakKeys: string[]
}

/**
 * Generates a drill from the weakest keys, saves it as a custom text, makes it
 * the active text and closes the drawer, dropping the user straight into practice.
 */
export function PracticeWeakKeysButton({ weakKeys }: Props) {
  const fallbackLanguage = useSettingsStore((s) => s.language)
  const selectCustomText = useSettingsStore((s) => s.selectCustomText)
  const closeDrawer = useSettingsStore((s) => s.closeDrawer)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const disabled = weakKeys.length === 0 || busy
  const language = pickDrillLanguage(weakKeys, fallbackLanguage)
  const targets = focusKeysFor(weakKeys, language)

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      const content = generateDrill(weakKeys, language)
      const id = await saveWeakKeysDrill(content, language)
      selectCustomText(id)
      closeDrawer()
    } catch (err) {
      console.error(err)
      setError('Could not create the drill. Your browser may be blocking local storage.')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:text-slate-950 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
      >
        {busy ? (
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
        ) : (
          <Dumbbell className="size-5" aria-hidden />
        )}
        Practice weak keys
      </button>

      {weakKeys.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          No missed keys yet. Finish a few sessions first.
        </p>
      ) : targets.length > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {language === 'th' ? 'Thai' : 'English'} drill targeting
          {targets.map((k) => (
            <KeyCap key={k} char={k} size="xs" tone="error" />
          ))}
        </p>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500">Mixed {language === 'th' ? 'Thai' : 'English'} drill</p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

import { useState } from 'react'
import { saveWeakKeysDrill } from '../lib/customTexts'
import { focusKeysFor, generateDrill, pickDrillLanguage } from '../lib/drill'
import { useSettingsStore } from '../store/useSettingsStore'

/**
 * "Practice weak keys": generate a drill from the weakest keys, save it as the
 * (single, reused) generated custom text, make it active and close the drawer.
 */
export function useWeakKeysDrill(weakKeys: readonly string[]) {
  const fallbackLanguage = useSettingsStore((s) => s.language)
  const selectCustomText = useSettingsStore((s) => s.selectCustomText)
  const closeDrawer = useSettingsStore((s) => s.closeDrawer)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const language = pickDrillLanguage(weakKeys, fallbackLanguage)

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      const id = await saveWeakKeysDrill(generateDrill(weakKeys, language), language)
      selectCustomText(id)
      closeDrawer() // unmounts the dashboard, so no need to reset `busy`
    } catch (err) {
      console.error('Failed to create weak-keys drill', err)
      setError('Could not create the drill. Your browser may be blocking local storage.')
      setBusy(false)
    }
  }

  return {
    start,
    busy,
    error,
    language,
    targets: focusKeysFor(weakKeys, language),
    disabled: weakKeys.length === 0 || busy,
  }
}

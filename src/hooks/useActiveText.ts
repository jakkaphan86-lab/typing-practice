import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo } from 'react'
import { builtinTextId, db, type CustomText, type TextId } from '../lib/db'
import { SAMPLE_TEXTS } from '../lib/sampleTexts'
import type { Language } from '../lib/types'
import { useSettingsStore } from '../store/useSettingsStore'

export interface ActiveText {
  id: TextId
  title: string
  language: Language
  content: string
  isCustom: boolean
}

interface QueryResult {
  /** The id this result was queried for (see below). */
  id: number | null
  text: CustomText | null
}

/**
 * Resolves what the user should be typing:
 *  - the selected custom text from Dexie (live: edits apply immediately), or
 *  - the built-in sample for the current language when nothing is selected,
 *    the selected text was deleted, or IndexedDB is unavailable.
 * Returns null only while the selected custom text is still loading.
 */
export function useActiveText(): ActiveText | null {
  const activeTextId = useSettingsStore((s) => s.activeTextId)
  const language = useSettingsStore((s) => s.language)
  const clearActiveText = useSettingsStore((s) => s.clearActiveText)

  // Tag the result with the id it was queried for: when deps change,
  // useLiveQuery keeps returning the previous result until the new one resolves.
  const result = useLiveQuery<QueryResult>(async () => {
    if (activeTextId === null) return { id: null, text: null }
    try {
      return { id: activeTextId, text: (await db.customTexts.get(activeTextId)) ?? null }
    } catch {
      return { id: activeTextId, text: null } // IndexedDB blocked → fallback
    }
  }, [activeTextId])

  const settled = result !== undefined && result.id === activeTextId
  const custom = settled ? result.text : null

  // Selected text no longer exists → forget the selection.
  const missing = activeTextId !== null && settled && custom === null
  useEffect(() => {
    if (missing) clearActiveText()
  }, [missing, clearActiveText])

  const loading = activeTextId !== null && !settled

  return useMemo(() => {
    if (loading) return null
    if (custom) {
      const { id, title, language: lang, content } = custom
      return { id, title, language: lang, content, isCustom: true }
    }
    const sample = SAMPLE_TEXTS[language]
    return { id: builtinTextId(language), title: sample.title, language, content: sample.text, isCustom: false }
  }, [loading, custom, language])
}

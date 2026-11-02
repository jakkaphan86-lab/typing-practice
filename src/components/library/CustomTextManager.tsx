import { useEffect, useRef, useState } from 'react'
import type { CustomText } from '../../lib/db'
import { useSettingsStore } from '../../store/useSettingsStore'
import { CustomTextForm } from './CustomTextForm'
import { CustomTextList } from './CustomTextList'

/**
 * "Texts" tab of the drawer: add / edit / delete custom texts and pick the
 * text to practise.
 */
export function CustomTextManager() {
  const activeTextId = useSettingsStore((s) => s.activeTextId)
  const language = useSettingsStore((s) => s.language)
  const selectCustomText = useSettingsStore((s) => s.selectCustomText)
  const selectBuiltin = useSettingsStore((s) => s.selectBuiltin)
  const closeDrawer = useSettingsStore((s) => s.closeDrawer)

  const [editing, setEditing] = useState<CustomText | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 2500)
    return () => window.clearTimeout(id)
  }, [notice])

  return (
    <div ref={topRef} className="flex flex-col gap-8">
      <CustomTextForm
        key={editing?.id ?? 'new'}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onSaved={(_id, isNew) => {
          setEditing(null)
          setNotice(isNew ? 'Text saved.' : 'Changes saved.')
        }}
      />

      <CustomTextList
        activeTextId={activeTextId}
        activeBuiltin={activeTextId === null ? language : null}
        editingId={editing?.id ?? null}
        onSelect={(t) => {
          selectCustomText(t.id)
          closeDrawer()
        }}
        onSelectBuiltin={(lang) => {
          selectBuiltin(lang)
          closeDrawer()
        }}
        onEdit={(t) => {
          setEditing(t)
          topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        onDeleted={(id) => {
          if (editing?.id === id) setEditing(null)
          // History is kept; useActiveText falls back to a built-in sample if needed.
          setNotice('Text deleted.')
        }}
      />

      {notice && (
        <div
          role="status"
          className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        >
          {notice}
        </div>
      )}
    </div>
  )
}

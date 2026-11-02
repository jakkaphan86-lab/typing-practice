import { useRef, useState } from 'react'
import { useAutoDismiss } from '../../hooks/useAutoDismiss'
import { deleteCustomText } from '../../lib/customTexts'
import type { CustomText } from '../../lib/db'
import { useSettingsStore } from '../../store/useSettingsStore'
import { Toast } from '../ui/Toast'
import { BuiltinSampleList } from './BuiltinSampleList'
import { CustomTextForm } from './CustomTextForm'
import { CustomTextList } from './CustomTextList'

/**
 * "Texts" tab of the drawer: add / edit / delete custom texts and pick the
 * text to practise (custom or built-in).
 */
export function CustomTextManager() {
  const activeTextId = useSettingsStore((s) => s.activeTextId)
  const language = useSettingsStore((s) => s.language)
  const selectCustomText = useSettingsStore((s) => s.selectCustomText)
  const selectBuiltin = useSettingsStore((s) => s.selectBuiltin)
  const closeDrawer = useSettingsStore((s) => s.closeDrawer)

  const [editing, setEditing] = useState<CustomText | null>(null)
  const [notice, showNotice] = useAutoDismiss()
  const topRef = useRef<HTMLDivElement>(null)

  const remove = async (text: CustomText) => {
    try {
      await deleteCustomText(text.id)
      if (editing?.id === text.id) setEditing(null)
      // History is kept; useActiveText falls back to a built-in sample if needed.
      showNotice('Text deleted.')
    } catch (err) {
      console.error('Failed to delete custom text', err)
      showNotice('Could not delete the text.')
    }
  }

  return (
    <div ref={topRef} className="flex flex-col gap-8">
      <CustomTextForm
        key={editing?.id ?? 'new'}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onSaved={(_id, isNew) => {
          setEditing(null)
          showNotice(isNew ? 'Text saved.' : 'Changes saved.')
        }}
      />

      <div className="flex flex-col gap-6">
        <CustomTextList
          activeTextId={activeTextId}
          editingId={editing?.id ?? null}
          onSelect={(t) => {
            selectCustomText(t.id)
            closeDrawer()
          }}
          onEdit={(t) => {
            setEditing(t)
            topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          onDelete={remove}
        />
        <BuiltinSampleList
          active={activeTextId === null ? language : null}
          onSelect={(lang) => {
            selectBuiltin(lang)
            closeDrawer()
          }}
        />
      </div>

      {notice && <Toast message={notice} />}
    </div>
  )
}

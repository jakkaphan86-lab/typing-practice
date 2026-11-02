import { useCustomTexts } from '../../hooks/useCustomTexts'
import type { CustomText } from '../../lib/db'
import { CustomTextItem } from './CustomTextItem'

interface CustomTextListProps {
  activeTextId: number | null
  editingId: number | null
  onSelect: (text: CustomText) => void
  onEdit: (text: CustomText) => void
  onDelete: (text: CustomText) => void
}

/** The user's saved texts, newest first. */
export function CustomTextList({ activeTextId, editingId, onSelect, onEdit, onDelete }: CustomTextListProps) {
  const texts = useCustomTexts()

  return (
    <section aria-labelledby="my-texts" className="flex flex-col gap-2">
      <h3 id="my-texts" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        My texts {texts && texts.length > 0 && <span className="font-normal text-slate-400">({texts.length})</span>}
      </h3>

      {texts === undefined ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
      ) : texts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
          No saved texts yet. Add one above. The built-in samples are below.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {texts.map((t) => (
            <CustomTextItem
              key={t.id}
              text={t}
              isActive={t.id === activeTextId}
              isEditing={t.id === editingId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

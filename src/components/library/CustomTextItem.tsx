import { Check, Pencil, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { CustomText } from '../../lib/db'
import { dateFormat } from '../../utils/format'
import { IconButton } from '../ui/IconButton'
import { LanguageBadge } from './LanguageBadge'

interface CustomTextItemProps {
  text: CustomText
  isActive: boolean
  isEditing: boolean
  onSelect: (text: CustomText) => void
  onEdit: (text: CustomText) => void
  onDelete: (text: CustomText) => void
}

/** One saved text: summary (click to practise) plus practise / edit / delete actions. */
export function CustomTextItem({ text, isActive, isEditing, onSelect, onEdit, onDelete }: CustomTextItemProps) {
  const [confirming, setConfirming] = useState(false)
  const name = `“${text.title}”`

  return (
    <li
      className={`rounded-lg border px-3 py-2.5 transition-colors ${
        isActive
          ? 'border-amber-400/70 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/5'
          : isEditing
            ? 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50'
            : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onSelect(text)}
          className="min-w-0 flex-1 text-left focus-visible:outline-none"
          aria-label={`Practise ${name}`}
        >
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-800 dark:text-slate-100">{text.title}</span>
            <LanguageBadge language={text.language} />
            {isActive && <Check className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-label="Active" />}
          </div>
          <p lang={text.language} className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
            {text.content}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            {text.tags.map((tag) => (
              <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {tag}
              </span>
            ))}
            <span>{dateFormat.format(text.createdAt)}</span>
          </div>
        </button>

        {confirming ? (
          <div className="flex shrink-0 items-center gap-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Delete?</span>
            <button
              type="button"
              onClick={() => onDelete(text)}
              className="rounded-md bg-red-500 px-2 py-1 font-medium text-white hover:bg-red-600"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-0.5">
            <IconButton label={`Practise ${name}`} onClick={() => onSelect(text)} size="sm" tone="muted">
              <Play className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Edit ${name}`} onClick={() => onEdit(text)} size="sm" tone="muted">
              <Pencil className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Delete ${name}`} onClick={() => setConfirming(true)} size="sm" tone="danger">
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </div>
        )}
      </div>
    </li>
  )
}

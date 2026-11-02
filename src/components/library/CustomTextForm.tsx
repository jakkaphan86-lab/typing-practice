import { Save, X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { useCustomTextForm } from '../../hooks/useCustomTextForm'
import { MAX_TAGS, MAX_TEXT_LENGTH } from '../../lib/customTexts'
import type { CustomText } from '../../lib/db'
import type { Language } from '../../lib/types'
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl'

const LANGUAGE_OPTIONS: readonly SegmentOption<Language>[] = [
  { value: 'th', label: 'ไทย' },
  { value: 'en', label: 'English' },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'

interface CustomTextFormProps {
  /** Text being edited, or null to create one. Remount with `key` to switch texts. */
  editing: CustomText | null
  onSaved: (id: number, isNew: boolean) => void
  onCancelEdit: () => void
}

export function CustomTextForm({ editing, onSaved, onCancelEdit }: CustomTextFormProps) {
  const form = useCustomTextForm({ editing, onSaved })
  const titleId = useId()
  const languageId = useId()
  const tagsId = useId()
  const contentId = useId()

  return (
    <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {editing ? 'Edit text' : 'Add a new text'}
        </h3>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="size-3.5" aria-hidden /> Cancel editing
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="Title" htmlFor={titleId}>
          <input
            id={titleId}
            value={form.values.title}
            onChange={(e) => form.setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Chapter 1 / บทที่ 1"
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Language" labelId={languageId}>
          <SegmentedControl
            options={LANGUAGE_OPTIONS}
            value={form.values.language}
            onChange={form.setLanguage}
            aria-labelledby={languageId}
            stretch
          />
        </Field>
      </div>

      <Field label="Tags" hint="(optional, comma-separated)" htmlFor={tagsId}>
        <input
          id={tagsId}
          value={form.values.tags}
          onChange={(e) => form.setTags(e.target.value)}
          placeholder="novel, practice, work"
          className={INPUT_CLASS}
        />
        {form.tagLimitReached && <p className="text-xs text-slate-400">Only the first {MAX_TAGS} tags are kept.</p>}
      </Field>

      <Field
        label="Text"
        htmlFor={contentId}
        aside={
          <span className={`text-xs tabular-nums ${form.contentTooLong ? 'text-red-500' : 'text-slate-400'}`}>
            {form.contentLength.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
          </span>
        }
      >
        <textarea
          id={contentId}
          value={form.values.content}
          onChange={(e) => form.setContent(e.target.value)}
          rows={6}
          lang={form.values.language}
          placeholder="Paste or type the text you want to practise…"
          className={`${INPUT_CLASS} resize-y font-sans leading-relaxed`}
        />
      </Field>

      {form.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {form.error}
        </p>
      )}

      <button
        type="submit"
        disabled={form.busy}
        className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-60 dark:text-slate-950"
      >
        <Save className="size-4" aria-hidden />
        {editing ? 'Save changes' : 'Save text'}
      </button>
    </form>
  )
}

interface FieldProps {
  label: string
  /** For a single control: the control's id. */
  htmlFor?: string
  /** For a group of controls (e.g. a radiogroup): id given to the label, referenced via aria-labelledby. */
  labelId?: string
  hint?: string
  aside?: ReactNode
  children: ReactNode
}

function Field({ label, htmlFor, labelId, hint, aside, children }: FieldProps) {
  const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={labelClass}>
            {label} {hint && <span className="font-normal">{hint}</span>}
          </label>
        ) : (
          <span id={labelId} className={labelClass}>
            {label}
          </span>
        )}
        {aside}
      </div>
      {children}
    </div>
  )
}

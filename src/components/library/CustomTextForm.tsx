import { Save, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import {
  addCustomText,
  detectLanguage,
  MAX_TAGS,
  MAX_TEXT_LENGTH,
  parseTags,
  updateCustomText,
  type CustomText,
} from '../../lib/db'
import type { Language } from '../../store/useSettingsStore'

const LANGUAGES: Array<{ value: Language; label: string }> = [
  { value: 'th', label: 'ไทย' },
  { value: 'en', label: 'English' },
]

interface FormState {
  title: string
  language: Language
  tags: string
  content: string
}

const EMPTY: FormState = { title: '', language: 'th', tags: '', content: '' }

const fromText = (t: CustomText): FormState => ({
  title: t.title,
  language: t.language,
  tags: t.tags.join(', '),
  content: t.content,
})

/** Remount with `key={editing?.id ?? 'new'}` to load a different text. */
interface Props {
  /** Text being edited, or null to create a new one. */
  editing: CustomText | null
  onSaved: (id: number, isNew: boolean) => void
  onCancelEdit: () => void
}

export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'

export function CustomTextForm({ editing, onSaved, onCancelEdit }: Props) {
  const ids = { title: useId(), language: useId(), tags: useId(), content: useId() }
  const [form, setForm] = useState<FormState>(() => (editing ? fromText(editing) : EMPTY))
  const [languageTouched, setLanguageTouched] = useState(editing !== null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const onContentChange = (content: string) => {
    // Auto-pick the language from pasted text until the user chooses one.
    setForm((f) => ({
      ...f,
      content,
      language: languageTouched || !content.trim() ? f.language : detectLanguage(content),
    }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const title = form.title.trim()
    const content = form.content.trim()
    if (!title) return setError('Please enter a title.')
    if (content.length < 10) return setError('Text must be at least 10 characters long.')
    if (content.length > MAX_TEXT_LENGTH) {
      return setError(`Text is too long (max ${MAX_TEXT_LENGTH.toLocaleString()} characters).`)
    }

    const payload = { title, language: form.language, tags: parseTags(form.tags), content }
    setBusy(true)
    setError(null)
    try {
      if (editing) {
        await updateCustomText(editing.id, payload)
        onSaved(editing.id, false)
      } else {
        const id = await addCustomText(payload)
        setForm(EMPTY)
        setLanguageTouched(false)
        onSaved(id, true)
      }
    } catch (err) {
      console.error(err)
      setError('Could not save. Your browser may be blocking local storage.')
    } finally {
      setBusy(false)
    }
  }

  const tagCount = parseTags(form.tags).length
  const length = form.content.trim().length

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.title} className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Title
          </label>
          <input
            id={ids.title}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            maxLength={120}
            placeholder="e.g. Chapter 1 / บทที่ 1"
            className={inputClass}
          />
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend id={ids.language} className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Language
          </legend>
          <div role="radiogroup" aria-labelledby={ids.language} className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={form.language === l.value}
                onClick={() => {
                  setLanguageTouched(true)
                  update('language', l.value)
                }}
                className={`h-8 flex-1 rounded-md px-3 text-sm transition-colors ${
                  form.language === l.value
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.tags} className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Tags <span className="font-normal">(optional, comma-separated)</span>
        </label>
        <input
          id={ids.tags}
          value={form.tags}
          onChange={(e) => update('tags', e.target.value)}
          placeholder="novel, practice, work"
          className={inputClass}
        />
        {tagCount >= MAX_TAGS && (
          <p className="text-xs text-slate-400">Only the first {MAX_TAGS} tags are kept.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={ids.content} className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Text
          </label>
          <span
            className={`text-xs tabular-nums ${length > MAX_TEXT_LENGTH ? 'text-red-500' : 'text-slate-400'}`}
          >
            {length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
          </span>
        </div>
        <textarea
          id={ids.content}
          value={form.content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={6}
          lang={form.language}
          placeholder="Paste or type the text you want to practise…"
          className={`${inputClass} resize-y font-sans leading-relaxed`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-60 dark:text-slate-950"
      >
        <Save className="size-4" aria-hidden />
        {editing ? 'Save changes' : 'Save text'}
      </button>
    </form>
  )
}

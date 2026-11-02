import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Pencil, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { SAMPLE_TEXTS } from '../../data/sampleTexts'
import { db, deleteCustomText, type CustomText } from '../../lib/db'
import type { Language } from '../../store/useSettingsStore'

interface Props {
  activeTextId: number | null
  activeBuiltin: Language | null
  editingId: number | null
  onSelect: (text: CustomText) => void
  onSelectBuiltin: (language: Language) => void
  onEdit: (text: CustomText) => void
  onDeleted: (id: number) => void
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function CustomTextList(props: Props) {
  const { activeTextId, activeBuiltin, editingId, onSelect, onSelectBuiltin, onEdit, onDeleted } = props

  // undefined while loading; [] if IndexedDB is unavailable.
  const texts = useLiveQuery(
    () => db.customTexts.orderBy('createdAt').reverse().toArray().catch(() => [] as CustomText[]),
    [],
  )
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  const remove = async (id: number) => {
    setConfirmingId(null)
    await deleteCustomText(id)
    onDeleted(id)
  }

  return (
    <div className="flex flex-col gap-6">
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
              <li
                key={t.id}
                className={`group rounded-lg border px-3 py-2.5 transition-colors ${
                  t.id === activeTextId
                    ? 'border-amber-400/70 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/5'
                    : t.id === editingId
                      ? 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50'
                      : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onSelect(t)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-none"
                    aria-label={`Practise “${t.title}”`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-800 dark:text-slate-100">{t.title}</span>
                      <LangBadge language={t.language} />
                      {t.id === activeTextId && (
                        <Check className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-label="Active" />
                      )}
                    </div>
                    <p lang={t.language} className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                      {t.content}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                      {t.tags.map((tag) => (
                        <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {tag}
                        </span>
                      ))}
                      <span>{dateFormat.format(t.createdAt)}</span>
                    </div>
                  </button>

                  {confirmingId === t.id ? (
                    <div className="flex shrink-0 items-center gap-1 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Delete?</span>
                      <button
                        type="button"
                        onClick={() => remove(t.id)}
                        className="rounded-md bg-red-500 px-2 py-1 font-medium text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <RowButton label={`Practise “${t.title}”`} onClick={() => onSelect(t)}>
                        <Play className="size-4" />
                      </RowButton>
                      <RowButton label={`Edit “${t.title}”`} onClick={() => onEdit(t)}>
                        <Pencil className="size-4" />
                      </RowButton>
                      <RowButton label={`Delete “${t.title}”`} onClick={() => setConfirmingId(t.id)} danger>
                        <Trash2 className="size-4" />
                      </RowButton>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="builtin-texts" className="flex flex-col gap-2">
        <h3 id="builtin-texts" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Built-in samples
        </h3>
        <ul className="flex flex-col gap-2">
          {(Object.keys(SAMPLE_TEXTS) as Language[]).map((lang) => (
            <li key={lang}>
              <button
                type="button"
                onClick={() => onSelectBuiltin(lang)}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  activeBuiltin === lang
                    ? 'border-amber-400/70 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/5'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="truncate text-slate-700 dark:text-slate-200">{SAMPLE_TEXTS[lang].title}</span>
                <LangBadge language={lang} />
                {activeBuiltin === lang && (
                  <Check className="ml-auto size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-label="Active" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function LangBadge({ language }: { language: Language }) {
  return (
    <span className="shrink-0 rounded border border-slate-200 px-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {language}
    </span>
  )
}

function RowButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:hover:bg-slate-800 ${
        danger ? 'hover:text-red-600 dark:hover:text-red-400' : 'hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

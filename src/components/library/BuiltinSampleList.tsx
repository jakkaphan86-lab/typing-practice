import { Check } from 'lucide-react'
import { SAMPLE_TEXTS } from '../../lib/sampleTexts'
import { LANGUAGES, type Language } from '../../lib/types'
import { LanguageBadge } from './LanguageBadge'

interface BuiltinSampleListProps {
  /** Language of the active built-in sample, or null when a custom text is active. */
  active: Language | null
  onSelect: (language: Language) => void
}

/** The always-available fallback passages. */
export function BuiltinSampleList({ active, onSelect }: BuiltinSampleListProps) {
  return (
    <section aria-labelledby="builtin-texts" className="flex flex-col gap-2">
      <h3 id="builtin-texts" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Built-in samples
      </h3>
      <ul className="flex flex-col gap-2">
        {LANGUAGES.map((lang) => (
          <li key={lang}>
            <button
              type="button"
              onClick={() => onSelect(lang)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                active === lang
                  ? 'border-amber-400/70 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/5'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="truncate text-slate-700 dark:text-slate-200">{SAMPLE_TEXTS[lang].title}</span>
              <LanguageBadge language={lang} />
              {active === lang && (
                <Check className="ml-auto size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-label="Active" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

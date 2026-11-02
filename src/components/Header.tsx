import { ChartColumn, Gauge, Keyboard, Library, Moon, Sun } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { SAMPLE_TEXTS } from '../data/sampleTexts'
import { useSettingsStore, type Language } from '../store/useSettingsStore'

// Prevent header controls from stealing focus from the hidden typing input.
const keepFocus = (e: MouseEvent) => e.preventDefault()

const buttonBase =
  'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-amber-500'

export function Header() {
  const {
    theme,
    showStats,
    language,
    activeTextId,
    toggleTheme,
    toggleStats,
    selectBuiltin,
    openDrawer,
  } = useSettingsStore()
  // The switch picks a built-in sample; with a custom text active, neither is checked.
  const builtinActive = activeTextId === null

  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
      <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
        <Keyboard className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
        <span className="hidden sm:inline">Typing Practice</span>
      </div>

      <nav className="flex items-center gap-1">
        <div role="radiogroup" aria-label="Language" className="mr-2 flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/70">
          {(Object.keys(SAMPLE_TEXTS) as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              role="radio"
              aria-checked={builtinActive && language === lang}
              title={SAMPLE_TEXTS[lang].title}
              onMouseDown={keepFocus}
              onClick={() => selectBuiltin(lang)}
              className={`${buttonBase} h-8 min-w-11 px-2.5 text-sm ${
                builtinActive && language === lang
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {SAMPLE_TEXTS[lang].label}
            </button>
          ))}
        </div>

        <IconButton label="Text library" onClick={() => openDrawer('texts')}>
          <Library className="size-5" aria-hidden />
        </IconButton>

        <IconButton label="My stats" onClick={() => openDrawer('stats')}>
          <ChartColumn className="size-5" aria-hidden />
        </IconButton>

        <IconButton
          label={showStats ? 'Hide live stats' : 'Show live stats'}
          pressed={showStats}
          onClick={toggleStats}
        >
          <Gauge className="size-5" aria-hidden />
        </IconButton>

        <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
        </IconButton>
      </nav>
    </header>
  )
}

interface IconButtonProps {
  label: string
  onClick: () => void
  pressed?: boolean
  children: ReactNode
}

function IconButton({ label, onClick, pressed, children }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={keepFocus}
      onClick={onClick}
      className={`${buttonBase} size-9 hover:bg-slate-100 dark:hover:bg-slate-800 ${
        pressed === false
          ? 'text-slate-400 dark:text-slate-500'
          : pressed
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

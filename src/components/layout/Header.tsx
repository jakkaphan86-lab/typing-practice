import { ChartColumn, Gauge, Keyboard, Library, Moon, Sun, Volume2, VolumeX } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useSoundToggle } from '../../hooks/useTypingSounds'
import { SAMPLE_TEXTS } from '../../lib/sampleTexts'
import { LANGUAGES, type Language } from '../../lib/types'
import { useSettingsStore } from '../../store/useSettingsStore'
import { IconButton } from '../ui/IconButton'
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl'

const SAMPLE_OPTIONS: readonly SegmentOption<Language>[] = LANGUAGES.map((lang) => ({
  value: lang,
  label: SAMPLE_TEXTS[lang].label,
  title: SAMPLE_TEXTS[lang].title,
}))

export function Header() {
  const { theme, showStats, language, builtinActive } = useSettingsStore(
    useShallow((s) => ({
      theme: s.theme,
      showStats: s.showStats,
      language: s.language,
      builtinActive: s.activeTextId === null,
    })),
  )
  const { toggleTheme, toggleStats, selectBuiltin, openDrawer } = useSettingsStore(
    useShallow((s) => ({
      toggleTheme: s.toggleTheme,
      toggleStats: s.toggleStats,
      selectBuiltin: s.selectBuiltin,
      openDrawer: s.openDrawer,
    })),
  )
  const { soundEnabled, toggleSound } = useSoundToggle()

  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
      <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
        <Keyboard className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
        <span className="hidden sm:inline">Typing Practice</span>
      </div>

      <nav className="flex items-center gap-1">
        <div className="mr-2">
          {/* Picks a built-in sample; with a custom text active, neither is selected. */}
          <SegmentedControl
            options={SAMPLE_OPTIONS}
            value={builtinActive ? language : null}
            onChange={selectBuiltin}
            aria-label="Language"
            preserveFocus
          />
        </div>

        <IconButton label="Text library" onClick={() => openDrawer('texts')} preserveFocus>
          <Library className="size-5" aria-hidden />
        </IconButton>
        <IconButton label="My stats" onClick={() => openDrawer('stats')} preserveFocus>
          <ChartColumn className="size-5" aria-hidden />
        </IconButton>
        <IconButton
          label={showStats ? 'Hide live stats' : 'Show live stats'}
          pressed={showStats}
          onClick={toggleStats}
          preserveFocus
        >
          <Gauge className="size-5" aria-hidden />
        </IconButton>
        <IconButton
          label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
          pressed={soundEnabled}
          onClick={toggleSound}
          preserveFocus
        >
          {soundEnabled ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
        </IconButton>
        <IconButton
          label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          preserveFocus
        >
          {theme === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
        </IconButton>
      </nav>
    </header>
  )
}

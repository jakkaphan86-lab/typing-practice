import { ChartColumn, Library, X, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useSettingsStore, type DrawerTab } from '../store/useSettingsStore'
import { CustomTextManager } from './library/CustomTextManager'
import { StatsDashboard } from './stats/StatsDashboard'

const TABS: Array<{ id: DrawerTab; label: string; icon: LucideIcon }> = [
  { id: 'texts', label: 'Texts', icon: Library },
  { id: 'stats', label: 'My stats', icon: ChartColumn },
]

/** Side drawer holding everything that isn't typing: the text library and stats. */
export function AppDrawer() {
  const tab = useSettingsStore((s) => s.drawerTab)
  // Mounted only while open, so tab state (editing, notices) resets on close.
  return tab ? <DrawerPanel tab={tab} /> : null
}

function DrawerPanel({ tab }: { tab: DrawerTab }) {
  const openDrawer = useSettingsStore((s) => s.openDrawer)
  const closeDrawer = useSettingsStore((s) => s.closeDrawer)
  const panelRef = useRef<HTMLDivElement>(null)

  // Esc closes; focus moves into the panel; the page behind doesn't scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDrawer()
      }
    }
    window.addEventListener('keydown', onKey)
    // Focus the dialog itself (no ring); Tab then reaches the tabs and content.
    panelRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [closeDrawer])

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onTabKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const i = TABS.findIndex((t) => t.id === tab)
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    openDrawer(next.id)
    panelRef.current?.querySelector<HTMLElement>(`#tab-${next.id}`)?.focus()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" onClick={closeDrawer} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'stats' ? 'My stats' : 'Text library'}
        tabIndex={-1}
        className="relative flex outline-none h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-950 dark:ring-1 dark:ring-slate-800"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div role="tablist" aria-label="Drawer sections" className="flex gap-1" onKeyDown={onTabKeyDown}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const selected = id === tab
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`panel-${id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => openDrawer(id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-amber-500 ${
                    selected
                      ? 'bg-slate-100 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="size-5" />
          </button>
        </header>

        <div
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="flex-1 overflow-y-auto px-5 py-5"
        >
          {tab === 'texts' ? <CustomTextManager /> : <StatsDashboard />}
        </div>
      </div>
    </div>
  )
}

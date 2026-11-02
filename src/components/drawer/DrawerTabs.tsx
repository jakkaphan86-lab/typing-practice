import { ChartColumn, Library, type LucideIcon } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import type { DrawerTab } from '../../store/useSettingsStore'
import { panelId, tabId } from './drawerIds'

const TABS: readonly { id: DrawerTab; label: string; icon: LucideIcon }[] = [
  { id: 'texts', label: 'Texts', icon: Library },
  { id: 'stats', label: 'My stats', icon: ChartColumn },
]

interface DrawerTabsProps {
  active: DrawerTab
  onSelect: (tab: DrawerTab) => void
}

/** Tab strip following the WAI-ARIA tabs pattern (arrow keys move between tabs). */
export function DrawerTabs({ active, onSelect }: DrawerTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const i = TABS.findIndex((t) => t.id === active)
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    if (!next) return
    onSelect(next.id)
    listRef.current?.querySelector<HTMLElement>(`#${tabId(next.id)}`)?.focus()
  }

  return (
    <div ref={listRef} role="tablist" aria-label="Drawer sections" className="flex gap-1" onKeyDown={onKeyDown}>
      {TABS.map(({ id, label, icon: Icon }) => {
        const selected = id === active
        return (
          <button
            key={id}
            id={tabId(id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(id)}
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
  )
}

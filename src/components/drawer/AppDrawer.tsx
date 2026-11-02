import { X } from 'lucide-react'
import { useRef } from 'react'
import { useDialog } from '../../hooks/useDialog'
import { useSettingsStore, type DrawerTab } from '../../store/useSettingsStore'
import { CustomTextManager } from '../library/CustomTextManager'
import { StatsDashboard } from '../stats/StatsDashboard'
import { IconButton } from '../ui/IconButton'
import { panelId, tabId } from './drawerIds'
import { DrawerTabs } from './DrawerTabs'

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
  useDialog(panelRef, closeDrawer)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" onClick={closeDrawer} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'stats' ? 'My stats' : 'Text library'}
        // Focused on open (no ring); Tab then reaches the tabs and content.
        tabIndex={-1}
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl outline-none dark:bg-slate-950 dark:ring-1 dark:ring-slate-800"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <DrawerTabs active={tab} onSelect={openDrawer} />
          <IconButton label="Close" onClick={closeDrawer} size="sm" tone="muted">
            <X className="size-5" aria-hidden />
          </IconButton>
        </header>

        <div id={panelId(tab)} role="tabpanel" aria-labelledby={tabId(tab)} className="flex-1 overflow-y-auto px-5 py-5">
          {tab === 'texts' ? <CustomTextManager /> : <StatsDashboard />}
        </div>
      </div>
    </div>
  )
}

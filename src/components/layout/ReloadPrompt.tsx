import { CircleCheck, RefreshCw, X } from 'lucide-react'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { reloadWhenNewWorkerTakesOver, warmFontCache } from '../../lib/pwa'
import { preventFocusSteal } from '../../utils/dom'

const OFFLINE_READY_MS = 4000

/**
 * Registers the service worker and surfaces its lifecycle unobtrusively:
 * a brief "ready to work offline" note after the first install, and an
 * "update available" prompt that reloads only when the user chooses to.
 */
export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW() {
      warmFontCache().catch((err: unknown) => console.error('Failed to cache web fonts for offline use', err))
    },
    onRegisterError(err: unknown) {
      console.error('Service worker registration failed', err)
    },
  })

  useEffect(() => {
    if (!offlineReady) return
    const id = window.setTimeout(() => setOfflineReady(false), OFFLINE_READY_MS)
    return () => window.clearTimeout(id)
  }, [offlineReady, setOfflineReady])

  if (!offlineReady && !needRefresh) return null

  return (
    <div
      role={needRefresh ? 'alert' : 'status'}
      className="fixed inset-x-4 bottom-4 z-40 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-lg sm:inset-x-auto sm:right-4 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    >
      {needRefresh ? (
        <>
          <RefreshCw className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span className="flex-1">A new version is available.</span>
          <button
            type="button"
            onMouseDown={preventFocusSteal}
            onClick={() => {
              reloadWhenNewWorkerTakesOver()
              void updateServiceWorker(true)
            }}
            className="rounded-md bg-amber-500 px-2.5 py-1 font-medium text-white hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:text-slate-950"
          >
            Reload
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            onMouseDown={preventFocusSteal}
            onClick={() => setNeedRefresh(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="size-4" aria-hidden />
          </button>
        </>
      ) : (
        <>
          <CircleCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <span>Ready to work offline.</span>
        </>
      )}
    </div>
  )
}

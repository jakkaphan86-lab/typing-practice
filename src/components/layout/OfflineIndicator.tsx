import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

/** Small "Offline" pill, rendered only while the browser reports no network. */
export function OfflineIndicator() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <span
      role="status"
      title="You're offline. Practice, your texts and stats keep working."
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
    >
      <WifiOff className="size-3.5" aria-hidden />
      {/* Icon-only on small screens, where the header is tight. */}
      <span className="sr-only sm:not-sr-only">Offline</span>
    </span>
  )
}

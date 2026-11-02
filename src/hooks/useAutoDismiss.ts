import { useEffect, useState } from 'react'

/** A message that clears itself after `ms` (for toasts / status notices). */
export function useAutoDismiss(ms = 2500): [message: string | null, show: (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(() => setMessage(null), ms)
    return () => window.clearTimeout(id)
  }, [message, ms])

  return [message, setMessage]
}

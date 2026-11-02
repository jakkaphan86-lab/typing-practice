/** "m:ss" for a session timer. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Compact total time: "42s", "18m", "1h 20m". */
export function formatTotalTime(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return `${Math.round(ms / 1000)}s`
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/** "s" when count ≠ 1 — for simple English plurals. */
export const plural = (count: number) => (count === 1 ? '' : 's')

export const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
export const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
export const shortDateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

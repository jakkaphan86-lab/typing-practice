/** A source of random numbers in [0, 1) — injectable for deterministic tests. */
export type Rng = () => number

export interface Weighted<T> {
  item: T
  weight: number
}

/** Pick an item with probability proportional to its weight. `items` must be non-empty. */
export function weightedPick<T>(items: readonly Weighted<T>[], rng: Rng): T {
  const last = items.at(-1)
  if (!last) throw new Error('weightedPick: no items')
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let r = rng() * total
  for (const i of items) {
    r -= i.weight
    if (r < 0) return i.item
  }
  return last.item
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = a[i] as T
    a[i] = a[j] as T
    a[j] = tmp
  }
  return a
}

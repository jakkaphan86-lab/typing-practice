import type { TypingHistoryEntry } from './db'

/* ------------------------------------------------------------------ */
/* Missed characters                                                   */
/* ------------------------------------------------------------------ */

export interface MissedChar {
  /** The expected character the user failed to type. */
  char: string
  count: number
  /** Fraction of all counted errors (0–1). */
  share: number
  /** What was most often typed instead, if anything stands out. */
  typedAs: string | null
}

/**
 * Streaming tally of missed characters, so even a large `errorLogs` table can
 * be aggregated with `Collection.each()` without loading it into an array.
 */
export class MissTally {
  private counts = new Map<string, { count: number; typed: Map<string, number> }>()
  total = 0

  add(expected: string, typed: string) {
    let entry = this.counts.get(expected)
    if (!entry) {
      entry = { count: 0, typed: new Map() }
      this.counts.set(expected, entry)
    }
    entry.count++
    entry.typed.set(typed, (entry.typed.get(typed) ?? 0) + 1)
    this.total++
  }

  /** Most-missed characters, highest count first (ties: alphabetical). */
  top(limit: number): MissedChar[] {
    return [...this.counts.entries()]
      .sort(([a, x], [b, y]) => y.count - x.count || a.localeCompare(b))
      .slice(0, limit)
      .map(([char, { count, typed }]) => {
        const [typedAs] = [...typed.entries()].sort((x, y) => y[1] - x[1])[0]
        return { char, count, share: count / this.total, typedAs }
      })
  }
}

export function rankMissedChars(
  errors: Iterable<{ expectedChar: string; typedChar: string }>,
  limit: number,
): MissedChar[] {
  const tally = new MissTally()
  for (const e of errors) tally.add(e.expectedChar, e.typedChar)
  return tally.top(limit)
}

/* ------------------------------------------------------------------ */
/* Session history                                                     */
/* ------------------------------------------------------------------ */

export interface HistorySummary {
  sessions: number
  /** Mean WPM over all sessions. */
  avgWpm: number
  bestWpm: number
  /** Mean accuracy (%) over all sessions. */
  avgAccuracy: number
  totalTimeMs: number
}

export function summarizeHistory(rows: TypingHistoryEntry[]): HistorySummary | null {
  if (rows.length === 0) return null
  let wpm = 0
  let accuracy = 0
  let best = 0
  let time = 0
  for (const r of rows) {
    wpm += r.wpm
    accuracy += r.accuracy
    best = Math.max(best, r.wpm)
    time += r.durationMs ?? 0
  }
  return {
    sessions: rows.length,
    avgWpm: wpm / rows.length,
    bestWpm: best,
    avgAccuracy: accuracy / rows.length,
    totalTimeMs: time,
  }
}

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

/** Thai marks that cannot stand alone; named so learners recognise them. */
const THAI_MARK_NAMES: Record<string, string> = {
  'ั': 'ไม้หันอากาศ',
  'ำ': 'สระอำ',
  'ิ': 'สระอิ',
  'ี': 'สระอี',
  'ึ': 'สระอึ',
  'ื': 'สระอือ',
  'ุ': 'สระอุ',
  'ู': 'สระอู',
  'ฺ': 'พินทุ',
  '็': 'ไม้ไต่คู้',
  '่': 'ไม้เอก',
  '้': 'ไม้โท',
  '๊': 'ไม้ตรี',
  '๋': 'ไม้จัตวา',
  '์': 'การันต์',
  'ํ': 'นิคหิต',
}

export interface CharDisplay {
  /** What to draw on the key cap. */
  glyph: string
  /** Human-readable name, when the glyph alone is ambiguous. */
  name: string | null
}

/**
 * Combining marks (tone marks, floating vowels) are drawn on a dotted-circle
 * base (U+25CC) — the standard way to show a mark in isolation.
 */
export function describeChar(ch: string): CharDisplay {
  if (ch === ' ') return { glyph: '␣', name: 'space' }
  if (ch === '\t') return { glyph: '⇥', name: 'tab' }
  const name = THAI_MARK_NAMES[ch] ?? null
  if (name || /^\p{M}$/u.test(ch)) return { glyph: `◌${ch}`, name }
  return { glyph: ch, name: null }
}

export function formatTotalTime(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return `${Math.round(ms / 1000)}s`
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

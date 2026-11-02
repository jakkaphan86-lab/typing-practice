/**
 * Adaptive drill generator: builds a short practice passage from the built-in
 * dictionary, heavily weighted towards the user's weakest keys.
 *
 * Pure (pass `rng` for deterministic output in tests).
 */
import { shuffle, weightedPick, type Rng, type Weighted } from '../utils/random'
import { DRILL_DICTIONARY } from './drillDictionary'
import type { Language } from './types'

export interface DrillOptions {
  /** Random source in [0, 1). Defaults to Math.random. */
  rng?: Rng
  /** Inclusive word-count range. Default 25–30. */
  minWords?: number
  maxWords?: number
}

/** Weight of the 1st, 2nd and 3rd weakest key, per occurrence in a word. */
const KEY_WEIGHTS = [4, 2, 1] as const
/** Share of words drawn from the weak-key pool (the rest keep it natural). */
const FOCUS_RATIO = 0.8
/** Each weak key is guaranteed to appear in at least this many words. */
const MIN_HITS_PER_KEY = 3
/** Each reuse of a word divides its weight by this, so drills stay varied. */
const REUSE_DAMPING = 4

const THAI_RE = /[฀-๿]/
const LATIN_RE = /[A-Za-z]/

/** Script a single key belongs to, or null for script-neutral keys (punctuation, digits). */
function scriptOf(key: string): Language | null {
  if (THAI_RE.test(key)) return 'th'
  if (LATIN_RE.test(key)) return 'en'
  return null
}

/**
 * Pick the drill language from the weakest keys: the script most of the top 3
 * belong to. Ties or script-neutral keys fall back to `fallback`.
 */
export function pickDrillLanguage(weakKeys: readonly string[], fallback: Language): Language {
  let th = 0
  let en = 0
  for (const key of weakKeys.filter((k) => k.trim()).slice(0, 3)) {
    const script = scriptOf(key)
    if (script === 'th') th++
    else if (script === 'en') en++
  }
  if (th === en) return fallback
  return th > en ? 'th' : 'en'
}

/** The (up to) 3 keys a drill in `language` will target, in priority order. */
export function focusKeysFor(weakKeys: readonly string[], language: Language): string[] {
  const keys: string[] = []
  for (const key of weakKeys) {
    if (!key.trim() || keys.includes(key)) continue // space is practised by every drill
    const script = scriptOf(key)
    if (script !== null && script !== language) continue
    keys.push(key)
    if (keys.length === 3) break
  }
  return keys
}

function countOccurrences(word: string, key: string, language: Language): number {
  const haystack = language === 'en' ? word.toLowerCase() : word
  const needle = language === 'en' ? key.toLowerCase() : key
  let n = 0
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) n++
  return n
}

/**
 * Generate a ~25–30 word practice passage weighted towards `weakKeys`
 * (most-missed first; only the top 3 matching `language` are used).
 *
 * - Letters/marks: words containing them are drawn with weight 4/2/1 per
 *   occurrence of the 1st/2nd/3rd key; each key appears in ≥3 words.
 * - Punctuation/digits (no dictionary words contain them): appended to words.
 * - English capitals: matching words are capitalised.
 * - No weak keys (or none usable): a plain mixed drill.
 */
export function generateDrill(weakKeys: readonly string[], language: Language, options: DrillOptions = {}): string {
  const { rng = Math.random, minWords = 25, maxWords = 30 } = options
  const dictionary = DRILL_DICTIONARY[language]
  const focus = focusKeysFor(weakKeys, language)
  const wordCount = minWords + Math.floor(rng() * (maxWords - minWords + 1))

  // Keys that dictionary words can contain vs. ones we have to inject.
  const letterKeys = focus.filter((k) => scriptOf(k) !== null)
  const injectKeys = focus.filter((k) => scriptOf(k) === null)
  const keyWeight = (key: string) => KEY_WEIGHTS[focus.indexOf(key)] ?? 1

  const focusPool: Weighted<string>[] = dictionary
    .map((word) => ({
      item: word,
      weight: letterKeys.reduce((sum, key) => sum + keyWeight(key) * countOccurrences(word, key, language), 0),
    }))
    .filter((w) => w.weight > 0)
  const generalPool: Weighted<string>[] = dictionary.map((word) => ({ item: word, weight: 1 }))

  const words: string[] = []
  const uses = new Map<string, number>()
  const take = (pool: readonly Weighted<string>[]) => {
    const word = weightedPick(
      pool.map((w) => ({ item: w.item, weight: w.weight / REUSE_DAMPING ** (uses.get(w.item) ?? 0) })),
      rng,
    )
    words.push(word)
    uses.set(word, (uses.get(word) ?? 0) + 1)
  }

  // 1. Guarantee coverage of every letter key (distinct words where possible).
  for (const key of letterKeys) {
    const containing = generalPool.filter((w) => countOccurrences(w.item, key, language) > 0)
    for (let i = 0; i < MIN_HITS_PER_KEY && containing.length > 0; i++) take(containing)
  }

  // 2. Fill the rest: mostly weighted weak-key words, some general ones.
  while (words.length < wordCount) {
    take(focusPool.length > 0 && rng() < FOCUS_RATIO ? focusPool : generalPool)
  }

  let drill = shuffle(words.slice(0, wordCount), rng)

  // Avoid the same word twice in a row (cheap pass; the dictionary is large enough).
  for (let i = 1; i < drill.length; i++) {
    const current = drill[i]
    if (current !== drill[i - 1]) continue
    const j = drill.findIndex((w, k) => k > i && w !== current)
    const swap = drill[j]
    if (j !== -1 && swap !== undefined && current !== undefined) {
      drill[i] = swap
      drill[j] = current
    }
  }

  // 3. English capitals: capitalise words that start with that letter.
  if (language === 'en') {
    for (const key of letterKeys) {
      if (key === key.toLowerCase()) continue
      drill = drill.map((w) => (w[0] === key.toLowerCase() ? key + w.slice(1) : w))
    }
  }

  // 4. Punctuation / digits: attach to several words.
  for (const key of injectKeys) {
    const hits = Math.max(MIN_HITS_PER_KEY, Math.round(wordCount * 0.2))
    for (const i of shuffle(Array.from(drill.keys()), rng).slice(0, hits)) drill[i] = `${drill[i]}${key}`
  }

  return drill.join(' ')
}

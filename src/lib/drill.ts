/**
 * Adaptive drill generator: builds a short practice passage from a small
 * built-in dictionary, heavily weighted towards the user's weakest keys.
 *
 * Pure and dependency-free (pass `rng` for deterministic output in tests).
 */

export type DrillLanguage = 'th' | 'en'

export interface DrillOptions {
  /** Random source in [0, 1). Defaults to Math.random. */
  rng?: () => number
  /** Inclusive word-count range. Default 25–30. */
  minWords?: number
  maxWords?: number
}

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

// Common Thai words chosen to cover every consonant class, the floating
// vowels (ิ ี ึ ื ุ ู ั ำ) and all tone marks (่ ้ ๊ ๋) plus ็ and ์.
const THAI_WORDS = `
กิน ข้าว น้ำ บ้าน ไป มา ดี ใจ รัก คน เรา เขา ที่ นี่ นั่น ได้ ไม่ ใช่ มี เป็น อยู่ คือ จะ ให้ กับ และ
หรือ แต่ ว่า ถ้า เมื่อ ทำ งาน เรียน รู้ เห็น ฟัง พูด อ่าน เขียน เดิน วิ่ง นั่ง นอน ตื่น ซื้อ ขาย ใหม่ เก่า
ใหญ่ เล็ก มาก น้อย สวย ร้อน หนาว เย็น สุข สนุก ง่าย ยาก เร็ว ช้า ใกล้ ไกล เช้า คืน วัน ปี เดือน เวลา
พ่อ แม่ พี่ น้อง เพื่อน ครู หมอ ร้าน ตลาด ถนน รถ เรือ ป่า ทะเล ภูเขา ฝน ลม ไฟ ดิน หิน ไม้ ดอก ผัก
ปลา ไก่ หมู นก แมว หมา ช้าง ม้า วัว ควาย ข่าว หนังสือ โต๊ะ เก้าอี้ ประตู ห้อง ครัว ทุ่ง นา สวน ท้อง
ฟ้า เมฆ ดาว จันทร์ ภาษา ไทย ความ สำคัญ จำ คำ ทำไม ฉัน ผม คุณ ด้วย ช่วย ค่ะ ครับ ก๋วยเตี๋ยว
เดี๋ยว ตั๋ว จ๋า ก็ หญิง ชาย ฉลาด ซ้าย ขวา ฆ่า ระฆัง ศึกษา ธง ภาพ ฝัน ฟัน ถาม ผ้า กีฬา ฤดู กฎ ฐาน
ปฏิบัติ ผู้เฒ่า ญาติ เณร ห่วง หมื่น ล้าน พัน ร้อย สิบ หนึ่ง สอง สาม สี่ ห้า หก เจ็ด แปด เก้า อร่อย
หวาน เค็ม เปรี้ยว ขม เผ็ด ส้ม กล้วย มะม่วง แตงโม ทุเรียน ฮา นกฮูก โอ่ง เอว แก้ว จาน ช้อน ส้อม
`
  .trim()
  .split(/\s+/)

const ENGLISH_WORDS = `
the be to of and a in that have it for not on with he as you do at this but his by from they we say
her she or an will my one all would there their what so up out if about who get which go me when make
can like time no just him know take people into year your good some could them see other than then now
look only come its over think also back after use two how our work first well way even new want because
any these give day most us is was are been has had were said did made find long down very still own
place great quick brown fox jumps lazy dog zebra quiz jazz box six next text quite equal queen square
judge just enjoy object major join keep kind black knock walk voice give every never seven over above
puzzle size zero frozen amaze extra mix wax exact fix quality question unique request liquid require
practice typing keyboard finger rhythm accuracy speed steady focus calm breathe simple small light
`
  .trim()
  .split(/\s+/)

const unique = (words: string[]) => [...new Set(words)]

const DICTIONARY: Record<DrillLanguage, string[]> = { th: unique(THAI_WORDS), en: unique(ENGLISH_WORDS) }

/** Weight of the 1st, 2nd and 3rd weakest key. */
const KEY_WEIGHTS = [4, 2, 1]
/** Share of words drawn from the weak-key pool (the rest keep it natural). */
const FOCUS_RATIO = 0.8
/** Each weak key is guaranteed to appear in at least this many words. */
const MIN_HITS_PER_KEY = 3

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const THAI_RE = /[฀-๿]/
const LATIN_RE = /[A-Za-z]/

/** Script a single key belongs to, or null for script-neutral keys (punctuation, digits). */
function scriptOf(key: string): DrillLanguage | null {
  if (THAI_RE.test(key)) return 'th'
  if (LATIN_RE.test(key)) return 'en'
  return null
}

/**
 * Pick the drill language from the weakest keys: the script most of the top 3
 * belong to. Ties or script-neutral keys fall back to `fallback`.
 */
export function pickDrillLanguage(weakKeys: string[], fallback: DrillLanguage): DrillLanguage {
  let th = 0
  let en = 0
  for (const key of weakKeys.filter((k) => k.trim()).slice(0, 3)) {
    const script = scriptOf(key)
    if (script === 'th') th++
    else if (script === 'en') en++
  }
  return th === en ? fallback : th > en ? 'th' : 'en'
}

/** The (up to) 3 keys a drill in `language` will target, in priority order. */
export function focusKeysFor(weakKeys: string[], language: DrillLanguage): string[] {
  const seen = new Set<string>()
  const keys: string[] = []
  for (const key of weakKeys) {
    if (!key.trim() || seen.has(key)) continue // space is practised by every drill
    const script = scriptOf(key)
    if (script !== null && script !== language) continue
    seen.add(key)
    keys.push(key)
    if (keys.length === 3) break
  }
  return keys
}

function countOccurrences(word: string, key: string, language: DrillLanguage): number {
  const haystack = language === 'en' ? word.toLowerCase() : word
  const needle = language === 'en' ? key.toLowerCase() : key
  let n = 0
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) n++
  return n
}

function weightedPick<T>(items: Array<{ item: T; weight: number }>, rng: () => number): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let r = rng() * total
  for (const i of items) {
    r -= i.weight
    if (r < 0) return i.item
  }
  return items[items.length - 1].item
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ------------------------------------------------------------------ */
/* Generator                                                           */
/* ------------------------------------------------------------------ */

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
export function generateDrill(
  weakKeys: string[],
  language: DrillLanguage,
  options: DrillOptions = {},
): string {
  const { rng = Math.random, minWords = 25, maxWords = 30 } = options
  const dictionary = DICTIONARY[language]
  const focus = focusKeysFor(weakKeys, language)
  const wordCount = minWords + Math.floor(rng() * (maxWords - minWords + 1))

  // Keys that dictionary words can contain vs. ones we have to inject.
  const letterKeys = focus.filter((k) => scriptOf(k) !== null)
  const injectKeys = focus.filter((k) => scriptOf(k) === null)

  const scored = dictionary
    .map((word) => ({
      item: word,
      weight: letterKeys.reduce(
        (sum, key) => sum + KEY_WEIGHTS[focus.indexOf(key)] * countOccurrences(word, key, language),
        0,
      ),
    }))
    .filter((w) => w.weight > 0)

  const words: string[] = []
  const uses = new Map<string, number>()
  const take = (word: string) => {
    words.push(word)
    uses.set(word, (uses.get(word) ?? 0) + 1)
  }
  // Each reuse quarters a word's chance, so drills stay varied.
  const damped = <T extends { item: string; weight: number }>(items: T[]) =>
    items.map((i) => ({ item: i.item, weight: i.weight / 4 ** (uses.get(i.item) ?? 0) }))

  // 1. Guarantee coverage of every letter key (distinct words where possible).
  for (const key of letterKeys) {
    const containing = dictionary
      .filter((w) => countOccurrences(w, key, language) > 0)
      .map((w) => ({ item: w, weight: 1 }))
    for (let i = 0; i < MIN_HITS_PER_KEY && containing.length > 0; i++) {
      take(weightedPick(damped(containing), rng))
    }
  }

  // 2. Fill the rest: mostly weighted weak-key words, some general ones.
  const everything = dictionary.map((w) => ({ item: w, weight: 1 }))
  while (words.length < wordCount) {
    const fromFocus = scored.length > 0 && rng() < FOCUS_RATIO
    take(weightedPick(damped(fromFocus ? scored : everything), rng))
  }

  let drill = shuffle(words.slice(0, wordCount), rng)

  // Avoid the same word twice in a row (cheap pass; dictionary is large enough).
  for (let i = 1; i < drill.length; i++) {
    if (drill[i] === drill[i - 1]) {
      const j = drill.findIndex((w, k) => k > i && w !== drill[i] && w !== drill[i - 1])
      if (j !== -1) [drill[i], drill[j]] = [drill[j], drill[i]]
    }
  }

  // 3. English capitals: capitalise words that start with that letter.
  for (const key of letterKeys) {
    if (language === 'en' && key !== key.toLowerCase()) {
      drill = drill.map((w) => (w[0] === key.toLowerCase() ? key + w.slice(1) : w))
    }
  }

  // 4. Punctuation / digits: attach to several words.
  for (const key of injectKeys) {
    const hits = Math.max(MIN_HITS_PER_KEY, Math.round(wordCount * 0.2))
    const indexes = shuffle(
      drill.map((_, i) => i),
      rng,
    ).slice(0, hits)
    for (const i of indexes) drill[i] = `${drill[i]}${key}`
  }

  return drill.join(' ')
}

/** Exposed for tests / tooling. */
export const DRILL_DICTIONARY = DICTIONARY

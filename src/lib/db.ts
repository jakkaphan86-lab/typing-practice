import Dexie, { type EntityTable } from 'dexie'
import type { Language } from '../store/useSettingsStore'

/**
 * Identifies the text a session was typed on: a `customTexts` id, or a
 * built-in sample (`builtin:th`, `builtin:en`) so history works for both.
 */
export type TextId = number | `builtin:${Language}`

export const builtinTextId = (language: Language): TextId => `builtin:${language}`

export interface CustomText {
  id: number
  title: string
  language: Language
  tags: string[]
  /** The passage itself. Not indexed. */
  content: string
  createdAt: number
  updatedAt: number
}

export interface TypingHistoryEntry {
  id: number
  textId: TextId
  wpm: number
  accuracy: number
  /** Extra session details (not indexed). */
  rawWpm: number
  durationMs: number
  timestamp: number
}

export interface ErrorLogEntry {
  id: number
  textId: TextId
  /** The `typingHistory` id of the session this error happened in (v2+; absent on older rows). */
  sessionId?: number
  expectedChar: string
  typedChar: string
  timestamp: number
}

export type NewCustomText = Omit<CustomText, 'id' | 'createdAt' | 'updatedAt'>

class TypingAppDB extends Dexie {
  customTexts!: EntityTable<CustomText, 'id'>
  typingHistory!: EntityTable<TypingHistoryEntry, 'id'>
  errorLogs!: EntityTable<ErrorLogEntry, 'id'>

  constructor() {
    super('TypingAppDB')
    this.version(1).stores({
      // `*tags` = multi-entry index, so `where('tags').equals('x')` matches any tag.
      customTexts: '++id, title, language, *tags, createdAt',
      typingHistory: '++id, textId, wpm, accuracy, timestamp',
      errorLogs: '++id, textId, expectedChar, typedChar, timestamp',
    })
    // v2: link each error to its session so the result screen can query it.
    this.version(2).stores({
      errorLogs: '++id, textId, sessionId, expectedChar, typedChar, timestamp',
    })
  }
}

export const db = new TypingAppDB()

/* ------------------------------------------------------------------ */
/* Custom texts                                                        */
/* ------------------------------------------------------------------ */

export const MAX_TEXT_LENGTH = 20_000
export const MAX_TAGS = 10

/** "a, b ,, A" → ["a", "b"] (trimmed, de-duplicated case-insensitively). */
export function parseTags(input: string): string[] {
  const seen = new Set<string>()
  const tags: string[] = []
  for (const raw of input.split(',')) {
    const tag = raw.trim().replace(/\s+/g, ' ')
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length === MAX_TAGS) break
  }
  return tags
}

/** Guess the language of pasted text: mostly Thai script → 'th'. */
export function detectLanguage(text: string): Language {
  const thai = text.match(/[฀-๿]/g)?.length ?? 0
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0
  return thai > latin ? 'th' : 'en'
}

export async function addCustomText(input: NewCustomText): Promise<number> {
  const now = Date.now()
  return db.customTexts.add({ ...input, createdAt: now, updatedAt: now })
}

export async function updateCustomText(id: number, input: NewCustomText): Promise<void> {
  await db.customTexts.update(id, { ...input, updatedAt: Date.now() })
}

export const GENERATED_TAG = 'generated'
export const WEAK_KEYS_DRILL_TITLE = 'Auto-Generated: Weak Keys Drill'

/**
 * Save a generated weak-keys drill and return its id. The previous drill (if
 * any) is overwritten rather than duplicated, so the library holds one
 * up-to-date drill no matter how often the user regenerates it. Its typing
 * history stays under the same id.
 */
export async function saveWeakKeysDrill(content: string, language: Language): Promise<number> {
  return db.transaction('rw', db.customTexts, async () => {
    const existing = await db.customTexts
      .where('tags')
      .equals(GENERATED_TAG)
      .filter((t) => t.title === WEAK_KEYS_DRILL_TITLE)
      .first()
    const payload = { title: WEAK_KEYS_DRILL_TITLE, language, tags: [GENERATED_TAG], content }
    if (existing) {
      await updateCustomText(existing.id, payload)
      return existing.id
    }
    return addCustomText(payload)
  })
}

/**
 * Delete a custom text. Its `typingHistory` and `errorLogs` rows are kept on
 * purpose: they feed global statistics even after the source text is gone.
 */
export async function deleteCustomText(id: number): Promise<void> {
  await db.customTexts.delete(id)
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export interface SessionRecord {
  textId: TextId
  wpm: number
  rawWpm: number
  accuracy: number
  durationMs: number
  timestamp: number
  errors: Array<{ expected: string; typed: string; timestamp: number }>
}

/**
 * Persist a finished session: one history row + one row per wrong keystroke.
 * Returns the history id, which doubles as the session id in `errorLogs`.
 */
export async function recordSession(session: SessionRecord): Promise<number> {
  const { textId, errors, ...stats } = session
  return db.transaction('rw', [db.typingHistory, db.errorLogs], async () => {
    const sessionId = await db.typingHistory.add({ textId, ...stats })
    if (errors.length > 0) {
      await db.errorLogs.bulkAdd(
        errors.map((e) => ({
          textId,
          sessionId,
          expectedChar: e.expected,
          typedChar: e.typed,
          timestamp: e.timestamp,
        })),
      )
    }
    return sessionId
  })
}

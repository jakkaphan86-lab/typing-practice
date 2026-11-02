/**
 * IndexedDB schema (Dexie) and the stored models. Data operations live in
 * `customTexts.ts` and `sessions.ts`; read-side hooks in `hooks/`.
 */
import Dexie, { type EntityTable } from 'dexie'
import type { Language } from './types'

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

/** Fields a caller provides when creating or editing a custom text. */
export type CustomTextInput = Pick<CustomText, 'title' | 'language' | 'tags' | 'content'>

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

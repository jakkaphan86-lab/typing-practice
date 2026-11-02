/** Custom-text operations and the validation/parsing rules that go with them. */
import { db, type CustomTextInput } from './db'
import type { Language } from './types'

export const MAX_TEXT_LENGTH = 20_000
const MIN_TEXT_LENGTH = 10
export const MAX_TAGS = 10

const GENERATED_TAG = 'generated'
const WEAK_KEYS_DRILL_TITLE = 'Auto-Generated: Weak Keys Drill'

/** "a, b ,, A" → ["a", "b"] (trimmed, de-duplicated case-insensitively, max 10). */
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

/** Returns a user-facing error message, or null when the input is valid. */
export function validateCustomText(title: string, content: string): string | null {
  if (!title.trim()) return 'Please enter a title.'
  const length = content.trim().length
  if (length < MIN_TEXT_LENGTH) return `Text must be at least ${MIN_TEXT_LENGTH} characters long.`
  if (length > MAX_TEXT_LENGTH) return `Text is too long (max ${MAX_TEXT_LENGTH.toLocaleString()} characters).`
  return null
}

export async function addCustomText(input: CustomTextInput): Promise<number> {
  const now = Date.now()
  return db.customTexts.add({ ...input, createdAt: now, updatedAt: now })
}

export async function updateCustomText(id: number, input: CustomTextInput): Promise<void> {
  await db.customTexts.update(id, { ...input, updatedAt: Date.now() })
}

/**
 * Delete a custom text. Its `typingHistory` and `errorLogs` rows are kept on
 * purpose: they feed global statistics even after the source text is gone.
 */
export async function deleteCustomText(id: number): Promise<void> {
  await db.customTexts.delete(id)
}

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
    const input: CustomTextInput = { title: WEAK_KEYS_DRILL_TITLE, language, tags: [GENERATED_TAG], content }
    if (existing) {
      await updateCustomText(existing.id, input)
      return existing.id
    }
    return addCustomText(input)
  })
}

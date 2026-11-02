import { useState, type FormEvent } from 'react'
import {
  addCustomText,
  detectLanguage,
  MAX_TAGS,
  MAX_TEXT_LENGTH,
  parseTags,
  updateCustomText,
  validateCustomText,
} from '../lib/customTexts'
import type { CustomText } from '../lib/db'
import type { Language } from '../lib/types'

export interface CustomTextFormValues {
  title: string
  language: Language
  tags: string
  content: string
}

const EMPTY: CustomTextFormValues = { title: '', language: 'th', tags: '', content: '' }

const fromText = (t: CustomText): CustomTextFormValues => ({
  title: t.title,
  language: t.language,
  tags: t.tags.join(', '),
  content: t.content,
})

interface Options {
  /** Text being edited, or null to create a new one. Remount (key) to switch texts. */
  editing: CustomText | null
  onSaved: (id: number, isNew: boolean) => void
}

/** State, derived info and submit logic for the add/edit custom text form. */
export function useCustomTextForm({ editing, onSaved }: Options) {
  const [values, setValues] = useState<CustomTextFormValues>(() => (editing ? fromText(editing) : EMPTY))
  // Until the user picks a language, it follows the pasted text.
  const [languageTouched, setLanguageTouched] = useState(editing !== null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const setTitle = (title: string) => setValues((v) => ({ ...v, title }))
  const setTags = (tags: string) => setValues((v) => ({ ...v, tags }))
  const setLanguage = (language: Language) => {
    setLanguageTouched(true)
    setValues((v) => ({ ...v, language }))
  }
  const setContent = (content: string) =>
    setValues((v) => ({
      ...v,
      content,
      language: languageTouched || !content.trim() ? v.language : detectLanguage(content),
    }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validateCustomText(values.title, values.content)
    if (validationError) {
      setError(validationError)
      return
    }

    const input = {
      title: values.title.trim(),
      language: values.language,
      tags: parseTags(values.tags),
      content: values.content.trim(),
    }
    setBusy(true)
    setError(null)
    try {
      if (editing) {
        await updateCustomText(editing.id, input)
        onSaved(editing.id, false)
      } else {
        const id = await addCustomText(input)
        setValues(EMPTY)
        setLanguageTouched(false)
        onSaved(id, true)
      }
    } catch (err) {
      console.error('Failed to save custom text', err)
      setError('Could not save. Your browser may be blocking local storage.')
    } finally {
      setBusy(false)
    }
  }

  const contentLength = values.content.trim().length

  return {
    values,
    setTitle,
    setTags,
    setLanguage,
    setContent,
    submit,
    error,
    busy,
    tagLimitReached: parseTags(values.tags).length >= MAX_TAGS,
    contentLength,
    contentTooLong: contentLength > MAX_TEXT_LENGTH,
  }
}

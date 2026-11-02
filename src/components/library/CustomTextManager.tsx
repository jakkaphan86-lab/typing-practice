import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CustomText } from '../../lib/db'
import { useSettingsStore } from '../../store/useSettingsStore'
import { CustomTextForm } from './CustomTextForm'
import { CustomTextList } from './CustomTextList'

/**
 * Side drawer for managing custom texts: add / edit / delete, and pick the
 * text to practise. Lives outside the typing area to keep the workspace clean.
 */
export function CustomTextManager() {
  const isOpen = useSettingsStore((s) => s.isLibraryOpen)
  // Mounted only while open, so drawer state (editing, notices) resets on close.
  return isOpen ? <LibraryDrawer /> : null
}

function LibraryDrawer() {
  const setOpen = useSettingsStore((s) => s.setLibraryOpen)
  const activeTextId = useSettingsStore((s) => s.activeTextId)
  const language = useSettingsStore((s) => s.language)
  const selectCustomText = useSettingsStore((s) => s.selectCustomText)
  const selectBuiltin = useSettingsStore((s) => s.selectBuiltin)

  const [editing, setEditing] = useState<CustomText | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const close = () => setOpen(false)

  // Esc closes; focus moves into the panel on open; background doesn't scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    panelRef.current?.querySelector<HTMLElement>('input, textarea, button')?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [setOpen])

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 2500)
    return () => window.clearTimeout(id)
  }, [notice])

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" onClick={close} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-title"
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-950 dark:ring-1 dark:ring-slate-800"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 id="library-title" className="font-semibold text-slate-800 dark:text-slate-100">
            Text library
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close text library"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="size-5" />
          </button>
        </header>

        <div ref={scrollRef} className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 py-5">
          <CustomTextForm
            key={editing?.id ?? 'new'}
            editing={editing}
            onCancelEdit={() => setEditing(null)}
            onSaved={(_id, isNew) => {
              setEditing(null)
              setNotice(isNew ? 'Text saved.' : 'Changes saved.')
            }}
          />

          <CustomTextList
            activeTextId={activeTextId}
            activeBuiltin={activeTextId === null ? language : null}
            editingId={editing?.id ?? null}
            onSelect={(t) => {
              selectCustomText(t.id)
              close()
            }}
            onSelectBuiltin={(lang) => {
              selectBuiltin(lang)
              close()
            }}
            onEdit={(t) => {
              setEditing(t)
              scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onDeleted={(id) => {
              if (editing?.id === id) setEditing(null)
              setNotice('Text deleted.')
              // useActiveText falls back to the built-in sample if it was active.
            }}
          />
        </div>

        {notice && (
          <div
            role="status"
            className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          >
            {notice}
          </div>
        )}
      </div>
    </div>
  )
}

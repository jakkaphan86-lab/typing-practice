# Typing Practice

Distraction-free typing practice for **Thai** and **English**.
React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · Dexie (IndexedDB) · Lucide React.

```bash
npm install
npm run dev
```

## Structure

```
src/
  hooks/useTypingEngine.ts   core engine: reducer, keystroke capture, WPM/accuracy
  hooks/useLineMetrics.ts    measures container width + font for exact line wrapping
  hooks/useActiveText.ts     selected custom text (live from Dexie) or built-in fallback
  hooks/useSessionRecorder.ts saves finished sessions to typingHistory + errorLogs
  lib/db.ts                  Dexie database 'TypingAppDB' + data helpers
  lib/segment.ts             grapheme & word segmentation (Intl.Segmenter, Thai-aware)
  lib/blocks.ts              passage → lines → static blocks (3 lines each)
  lib/stats.ts               WPM / accuracy math
  store/useSettingsStore.ts  Zustand (persisted): theme, stats, language, activeTextId
  components/                Header, TypingArea, TextBlockView, StatsBar, ResultCard
  components/library/        CustomTextManager drawer: form + list (select/edit/delete)
  data/sampleTexts.ts        mock Thai / English passages
```

## Engine rules

- **Input:** a hidden `<input>` plus a global `keydown` listener (no visible textarea).
  Every code point the browser inserts is one keystroke; IME composition is flushed on `compositionend`.
- **WPM:** `(correct keystrokes / 5) / minutes`, spaces included. Raw WPM uses all keystrokes.
- **Accuracy:** `correct keystrokes / total keystrokes × 100`. Backspace does not refund keystrokes.
- **Thai:** input is compared per code point, while text is rendered per grapheme cluster,
  so upper/lower vowels and tone marks never detach from their consonant. A cluster is red if
  any of its code points is wrong. Marks within one cluster may be typed in either order
  (e.g. `ม ่ ำ` or `ม ำ ่`), since they look the same on screen.
- **Static block pagination:** lines are pre-wrapped using real pixel measurements and grouped
  into 3-line blocks. Finishing a block replaces it with the next one, with no scrolling.
  Backspace only works inside the current block.

## Local storage (IndexedDB via Dexie)

Database `TypingAppDB`, version 1:

| Table | Indexes | Notes |
| --- | --- | --- |
| `customTexts` | `++id, title, language, *tags, createdAt` | also stores `content`, `updatedAt`; `*tags` is multi-entry |
| `typingHistory` | `++id, textId, wpm, accuracy, timestamp` | also `rawWpm`, `durationMs` |
| `errorLogs` | `++id, textId, expectedChar, typedChar, timestamp` | one row per wrong keystroke |

- `textId` is a `customTexts` id, or `builtin:th` / `builtin:en` for the built-in samples.
- Only **finished** sessions are recorded. Deleting a custom text keeps its history and error logs
  (they still count towards global statistics).
- When no custom text is selected, the selected text was deleted, or IndexedDB is unavailable,
  the built-in sample for the current language is used.

Keys: `Esc` restart · `Ctrl/Alt + Backspace` delete word.

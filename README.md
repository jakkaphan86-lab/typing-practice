# Typing Practice

Distraction-free typing practice for **Thai** and **English**.
React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · Dexie (IndexedDB) · Recharts · Lucide React.

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
  hooks/useAnalytics.ts      live global stats + per-session most-missed characters
  lib/analytics.ts           aggregation (MissTally, summaries) + Thai mark display names
  lib/drill.ts               adaptive drill generator (weak-key weighted, Thai + English dictionaries)
  lib/db.ts                  Dexie database 'TypingAppDB' + data helpers
  lib/segment.ts             grapheme & word segmentation (Intl.Segmenter, Thai-aware)
  lib/blocks.ts              passage → lines → static blocks (3 lines each)
  lib/stats.ts               WPM / accuracy math
  store/useSettingsStore.ts  Zustand (persisted): theme, stats, language, activeTextId
  components/                Header, TypingArea, TextBlockView, StatsBar, ResultScreen, AppDrawer
  components/library/        CustomTextManager ("Texts" tab): form + list (select/edit/delete)
  components/stats/          StatsDashboard ("My stats" tab), WpmProgressChart (lazy-loaded),
                             PracticeWeakKeysButton, KeyCap
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

Database `TypingAppDB`, schema version 2:

| Table | Indexes | Notes |
| --- | --- | --- |
| `customTexts` | `++id, title, language, *tags, createdAt` | also stores `content`, `updatedAt`; `*tags` is multi-entry |
| `typingHistory` | `++id, textId, wpm, accuracy, timestamp` | also `rawWpm`, `durationMs` |
| `errorLogs` | `++id, textId, sessionId, expectedChar, typedChar, timestamp` | one row per wrong keystroke; `sessionId` = `typingHistory` id (added in v2) |

- `textId` is a `customTexts` id, or `builtin:th` / `builtin:en` for the built-in samples.
- Only **finished** sessions are recorded. Deleting a custom text keeps its history and error logs
  (they still count towards global statistics).
- When no custom text is selected, the selected text was deleted, or IndexedDB is unavailable,
  the built-in sample for the current language is used.

## Analytics

- **Result screen:** WPM, accuracy and time, plus the session's **top 3 most-missed characters**,
  read from `errorLogs` by `sessionId`.
- **My stats** (drawer tab): average WPM (with best), average accuracy, session count, and the
  **5 weakest keys** across all of `errorLogs`, with how often each was missed and what was typed instead.
- **WPM progress chart** (Recharts line chart, last 30 sessions): X = session, labelled by date;
  Y = WPM; dashed line = overall average. Colours follow the light/dark theme; the chart code is
  lazy-loaded so the typing page doesn't download Recharts.
- Averages are per-session means. Thai tone marks and floating vowels are shown on a dotted circle
  (◌่) with their Thai name (ไม้เอก).

## Adaptive drills

**Practice weak keys** (bottom of *My stats*, disabled until there are error logs):

1. `generateDrill(weakKeys, language)` (`src/lib/drill.ts`) builds a 25–30 word passage from a built-in
   dictionary (~190 Thai / ~180 English words covering every Thai tone mark and floating vowel and a–z).
   The top 3 weak keys are weighted 4 / 2 / 1 per occurrence, each appears in at least 3 words, ~80% of words
   come from the weak-key pool, and repeated words are damped for variety. Punctuation and digits are
   appended to words; English capitals capitalise matching words.
2. The language follows the script of the top weak keys (ties → current language).
3. The drill is saved to `customTexts` as **"Auto-Generated: Weak Keys Drill"** with tag `generated`.
   Regenerating overwrites that row instead of adding duplicates.
4. It becomes the `activeTextId`, the drawer closes, and the typing area is focused.

Keys: `Esc` restart · `Ctrl/Alt + Backspace` delete word.

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
  components/            presentational React components (PascalCase)
    layout/              Header, KeyboardHints
    typing/              TypingArea, TextBlockView, WordView (memoised per word), LiveStatsBar,
                         TypingBoard, HiddenTypingInput, ActiveTextButton
    results/             ResultScreen, ResultSummary, MostMissedKeys
    drawer/              AppDrawer, DrawerTabs
    library/             CustomTextManager, CustomTextForm, CustomTextList, CustomTextItem, …
    stats/               StatsDashboard, StatsOverview, WpmProgressSection/Chart (lazy), WeakestKeysSection, …
    ui/                  shared primitives: IconButton, SegmentedControl, GhostButton, KeyCap, Toast
  hooks/                 React logic (camelCase, use*)
    useTypingSession     composes everything the typing screen needs
    useTypingEngine      React binding for the pure engine
    useTypingInput       hidden-input + global keyboard capture
    useLiveStats         the live-stats clock (only the stats bar re-renders on ticks)
    useLineMetrics       pixel-accurate line wrapping (canvas measureText)
    useActiveText, useSessionRecorder, useAnalytics, useCustomTexts, useCustomTextForm,
    useWeakKeysDrill, useTypingSounds, useDialog, useAutoDismiss, useApplyTheme
  store/                 Zustand settings store (persisted)
  lib/                   framework-free domain logic
    typingEngine.ts      pure reducer (keystrokes, Thai mark-order tolerance, pagination)
    blocks.ts, segment.ts  grapheme/word segmentation and static block building
    stats.ts, analytics.ts, drill.ts, drillDictionary.ts, sampleTexts.ts, types.ts
    audio.ts             procedural Web Audio sound effects (no audio files)
    db.ts                Dexie schema + models; customTexts.ts / sessions.ts: data operations
  utils/                 generic helpers: format, random, dom
```

Conventions: `lib/` never imports React or the store; components get data through hooks;
TypeScript runs with `strict` + `noUncheckedIndexedAccess`; oxlint forbids `any`, non-null
assertions, `console` (except `console.error`) and enforces hook dependencies.

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

## Sound effects

Toggle with the speaker icon in the header (off by default; the setting persists).

- **Synthesised, not sampled:** `src/lib/audio.ts` builds each sound from oscillators and gain envelopes
  (Web Audio API). There are no audio files to download or decode.
  - correct key: ~17 ms bright tap
  - wrong key: ~66 ms low, muffled thud
  - block complete: ~0.4 s two-note chime
- **Triggered in the keystroke handler:** `useTypingEngine` evaluates each keystroke there, by running the pure
  reducer on its latest state, and calls `onFeedback` before React re-renders (measured median ≈ 0.8 ms from
  key event to sound). The reducer itself stays pure, so StrictMode's double-invocation can't double sounds.
- **No re-renders:** `useTypingSounds` reads the setting at call time, so toggling sound doesn't re-render the
  typing screen. Backspace is silent; typing in the drawer's forms is silent.

Keys: `Esc` restart · `Ctrl/Alt + Backspace` delete word.

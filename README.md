# Typing Practice (Phase 1 — MVP)

Distraction-free typing practice for **Thai** and **English**.
React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · Lucide React.

```bash
npm install
npm run dev
```

## Structure

```
src/
  hooks/useTypingEngine.ts   core engine: reducer, keystroke capture, WPM/accuracy
  hooks/useLineMetrics.ts    measures container width + font for exact line wrapping
  lib/segment.ts             grapheme & word segmentation (Intl.Segmenter, Thai-aware)
  lib/blocks.ts              passage → lines → static blocks (3 lines each)
  lib/stats.ts               WPM / accuracy math
  store/useSettingsStore.ts  Zustand (persisted): theme, stats visibility, language
  components/                Header, TypingArea, TextBlockView, StatsBar, ResultCard
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

Keys: `Esc` restart · `Ctrl/Alt + Backspace` delete word.

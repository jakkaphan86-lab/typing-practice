import { describeChar } from '../../lib/analytics'

interface Props {
  char: string
  size?: 'xs' | 'sm' | 'md'
  tone?: 'neutral' | 'error'
}

/** A keyboard-key style tile showing one character (Thai marks on ◌). */
export function KeyCap({ char, size = 'md', tone = 'neutral' }: Props) {
  const { glyph, name } = describeChar(char)
  return (
    <kbd
      title={name ?? undefined}
      aria-label={name ?? char}
      className={`inline-flex shrink-0 items-center justify-center border-b-2 font-sans leading-none ${
        size === 'md' ? 'size-11 rounded-lg text-2xl' : size === 'sm' ? 'size-8 rounded-lg text-lg' : 'size-6 rounded-md text-sm'
      } ${
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
          : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
      }`}
    >
      <span lang="th">{glyph}</span>
    </kbd>
  )
}

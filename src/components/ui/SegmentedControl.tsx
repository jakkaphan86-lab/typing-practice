import { preventFocusSteal } from '../../utils/dom'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  title?: string
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[]
  /** Selected value, or null when none is selected. */
  value: T | null
  onChange: (value: T) => void
  'aria-label'?: string
  'aria-labelledby'?: string
  /** Segments share the full width instead of sizing to content. */
  stretch?: boolean
  /** Keep focus on the hidden typing input when clicked with the mouse. */
  preserveFocus?: boolean
}

/** A compact single-choice control (radiogroup), e.g. ไทย | EN. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  stretch = false,
  preserveFocus = false,
  ...aria
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" {...aria} className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/70">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.title}
            onMouseDown={preserveFocus ? preventFocusSteal : undefined}
            onClick={() => onChange(option.value)}
            className={`h-8 rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-amber-500 ${
              stretch ? 'flex-1 px-3' : 'min-w-11 px-2.5'
            } ${
              selected
                ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

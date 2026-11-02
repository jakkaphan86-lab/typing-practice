import type { MouseEvent } from 'react'

/**
 * `onMouseDown` handler that stops a button from taking focus when clicked,
 * so the hidden typing input keeps it (keyboard focus via Tab still works).
 */
export const preventFocusSteal = (e: MouseEvent) => e.preventDefault()

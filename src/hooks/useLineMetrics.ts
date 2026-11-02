import { useEffect, useLayoutEffect, useMemo, useState, type RefObject } from 'react'
import type { MeasureText } from '../lib/blocks'

/** Keep a little slack for kerning/sub-pixel differences between canvas and DOM. */
const SAFETY = 0.97

interface Metrics {
  width: number
  font: string
  /** Bumped when web fonts finish loading (glyph widths change, font string doesn't). */
  fontsVersion: number
}

export interface LineMetrics {
  maxLineWidth: number
  measure: MeasureText
}

let canvasContext: CanvasRenderingContext2D | null = null

function createCanvasMeasurer(font: string): MeasureText {
  canvasContext ??= document.createElement('canvas').getContext('2d')
  const ctx = canvasContext
  return (text) => {
    if (!ctx) return text.length // no canvas support: fall back to character count
    ctx.font = font
    return ctx.measureText(text).width
  }
}

/**
 * Measures the real pixel width available for text inside `ref` and returns a
 * canvas-based `measure()` using the element's computed font. This lets the
 * engine pre-wrap lines exactly, so a static block shows exactly N lines with
 * no browser re-wrapping (important for Thai, whose glyph widths vary a lot).
 * Returns null until the element has been measured.
 */
export function useLineMetrics(ref: RefObject<HTMLElement | null>): LineMetrics | null {
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      // Hidden (display:none) → width 0; keep the last layout instead of re-wrapping.
      if (el.clientWidth === 0) return
      const cs = getComputedStyle(el)
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      const width = Math.floor(el.clientWidth * SAFETY)
      setMetrics((m) =>
        m && m.width === width && m.font === font ? m : { width, font, fontsVersion: m?.fontsVersion ?? 0 },
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  useEffect(() => {
    const fonts = document.fonts
    const bump = () => setMetrics((m) => m && { ...m, fontsVersion: m.fontsVersion + 1 })
    fonts.addEventListener('loadingdone', bump)
    return () => fonts.removeEventListener('loadingdone', bump)
  }, [])

  return useMemo(
    () => (metrics ? { maxLineWidth: metrics.width, measure: createCanvasMeasurer(metrics.font) } : null),
    [metrics],
  )
}

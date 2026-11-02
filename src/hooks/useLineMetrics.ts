import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react'

/** Keep a little slack for kerning/sub-pixel differences between canvas and DOM. */
const SAFETY = 0.97

interface Metrics {
  width: number
  font: string
}

/**
 * Measures the real pixel width available for text inside `ref` and returns a
 * canvas-based `measure()` using the element's computed font. This lets the
 * engine pre-wrap lines exactly, so a static block shows exactly N lines with
 * no browser re-wrapping (important for Thai, whose glyph widths vary a lot).
 */
export function useLineMetrics(ref: RefObject<HTMLElement | null>) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [fontVersion, setFontVersion] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      // Hidden (display:none) → width 0; keep the last layout instead of re-wrapping.
      if (el.clientWidth === 0) return
      const cs = getComputedStyle(el)
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      const width = Math.floor(el.clientWidth * SAFETY)
      setMetrics((m) => (m && m.width === width && m.font === font ? m : { width, font }))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  // Web fonts change glyph widths without changing the font string → re-measure.
  useEffect(() => {
    const fonts = document.fonts
    if (!fonts) return
    const bump = () => setFontVersion((v) => v + 1)
    fonts.addEventListener('loadingdone', bump)
    return () => fonts.removeEventListener('loadingdone', bump)
  }, [])

  const font = metrics?.font
  const measure = useCallback(
    (text: string) => {
      const ctx = getContext()
      ctx.font = font ?? ''
      return ctx.measureText(text).width
    },
    // fontVersion intentionally invalidates the function after fonts load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [font, fontVersion],
  )

  return metrics ? { maxLineWidth: metrics.width, measure } : null
}

let ctx: CanvasRenderingContext2D | null = null
function getContext(): CanvasRenderingContext2D {
  ctx ??= document.createElement('canvas').getContext('2d')!
  return ctx
}

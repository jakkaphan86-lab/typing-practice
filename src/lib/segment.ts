/**
 * Unicode-aware text segmentation.
 *
 * Thai is the reason this file exists: a single visible "character" (grapheme
 * cluster) can be made of several code points, e.g. "กิ่" = ก + ิ (upper vowel)
 * + ่ (tone mark). Each code point is a separate keystroke on a Thai keyboard,
 * but they must be *rendered* together — wrapping a combining mark in its own
 * <span> detaches it from its base consonant (dotted circles, wrong stacking).
 *
 * So the engine tracks input per code point, while the UI renders per cluster.
 */

const hasSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl

const graphemeSegmenter = hasSegmenter
  ? new Intl.Segmenter('th', { granularity: 'grapheme' })
  : null

const wordSegmenters = new Map<string, Intl.Segmenter>()

/** Split a string into user-perceived characters (extended grapheme clusters). */
export function splitGraphemes(text: string): string[] {
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), (s) => s.segment)
  }
  // Fallback: a base character followed by any combining marks. Thai SARA AM
  // (ำ U+0E33) is a spacing letter, so attach it explicitly as well.
  return text.match(/[^\p{M}ำ][\p{M}ำ]*|[\p{M}ำ]+/gu) ?? []
}

export interface WordSegment {
  text: string
  /** true for actual words, false for whitespace and punctuation. */
  isWordLike: boolean
}

/**
 * Split text into words. Thai has no spaces between words, so we rely on the
 * dictionary-based `Intl.Segmenter` (supported in all modern browsers).
 */
export function splitWords(text: string, locale: string): WordSegment[] {
  if (hasSegmenter) {
    let segmenter = wordSegmenters.get(locale)
    if (!segmenter) {
      segmenter = new Intl.Segmenter(locale, { granularity: 'word' })
      wordSegmenters.set(locale, segmenter)
    }
    return Array.from(segmenter.segment(text), (s) => ({
      text: s.segment,
      isWordLike: Boolean(s.isWordLike),
    }))
  }
  return (text.match(/\s+|\S+/g) ?? []).map((t) => ({
    text: t,
    isWordLike: !/^\s+$/.test(t),
  }))
}

export const isWhitespace = (text: string) => /^\s+$/.test(text)

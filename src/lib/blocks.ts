import { isWhitespace, splitGraphemes, splitWords, type WordSegment } from './segment'

/** One visible character. `start`/`end` index into the block's code points. */
export interface ClusterInfo {
  index: number
  text: string
  start: number
  end: number
}

export interface WordInfo {
  id: number
  wordLike: boolean
  clusters: ClusterInfo[]
}

export interface LineInfo {
  words: WordInfo[]
}

/** A static page of text: a few lines that are typed, then swapped out. */
export interface TextBlock {
  /** Code points the user must type (one keystroke each). */
  chars: string[]
  clusters: ClusterInfo[]
  words: WordInfo[]
  lines: LineInfo[]
  /** chars[i] belongs to clusters[charToCluster[i]]. */
  charToCluster: number[]
  /** clusters[i] belongs to words[clusterToWord[i]]. */
  clusterToWord: number[]
}

export interface BlockOptions {
  locale: string
  linesPerBlock: number
  /** Max line width, in the same unit `measure` returns (px, or characters). */
  maxLineWidth: number
  /** Width of a string. Defaults to grapheme count (combining marks have no width). */
  measure?: (text: string) => number
}

const countGraphemes = (text: string) => splitGraphemes(text).length

/** Normalize raw passage text: NFC, collapse whitespace/newlines into single spaces. */
export function normalizeText(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim()
}

/**
 * Group word segments into unbreakable "units": a word plus any punctuation
 * glued to it plus its trailing space. Lines may only break between units.
 */
function toUnits(segments: WordSegment[]): WordSegment[][] {
  const units: WordSegment[][] = []
  for (const seg of segments) {
    const prev = units.at(-1)
    const prevEndsWithSpace = prev ? isWhitespace(prev.at(-1)!.text) : true
    const startsNewUnit = !prev || (!isWhitespace(seg.text) && (prevEndsWithSpace || seg.isWordLike))
    if (startsNewUnit) units.push([seg])
    else prev.push(seg)
  }
  return units
}

/** Greedy line wrapping; a unit's trailing space may hang past the edge. */
function toLines(
  units: WordSegment[][],
  maxWidth: number,
  measure: (text: string) => number,
): WordSegment[][] {
  const lines: WordSegment[][] = []
  let line: WordSegment[] = []
  let width = 0
  for (const unit of units) {
    const unitText = unit.map((s) => s.text).join('')
    const unitWidth = measure(unitText)
    const visibleWidth = measure(unitText.trimEnd())
    if (line.length > 0 && width + visibleWidth > maxWidth) {
      lines.push(line)
      line = []
      width = 0
    }
    line.push(...unit)
    width += unitWidth
  }
  if (line.length > 0) lines.push(line)
  return lines
}

function toBlock(lines: WordSegment[][]): TextBlock {
  const chars: string[] = []
  const clusters: ClusterInfo[] = []
  const words: WordInfo[] = []
  const charToCluster: number[] = []
  const clusterToWord: number[] = []

  const lineInfos: LineInfo[] = lines.map((line) => ({
    words: line.map((seg) => {
      const word: WordInfo = { id: words.length, wordLike: seg.isWordLike, clusters: [] }
      for (const grapheme of splitGraphemes(seg.text)) {
        const codePoints = Array.from(grapheme)
        const cluster: ClusterInfo = {
          index: clusters.length,
          text: grapheme,
          start: chars.length,
          end: chars.length + codePoints.length,
        }
        for (const cp of codePoints) {
          chars.push(cp)
          charToCluster.push(cluster.index)
        }
        clusters.push(cluster)
        clusterToWord.push(word.id)
        word.clusters.push(cluster)
      }
      words.push(word)
      return word
    }),
  }))

  return { chars, clusters, words, lines: lineInfos, charToCluster, clusterToWord }
}

/** Split a passage into static blocks of `linesPerBlock` lines each. */
export function buildBlocks(raw: string, opts: BlockOptions): TextBlock[] {
  const text = normalizeText(raw)
  if (!text) return []
  const units = toUnits(splitWords(text, opts.locale))
  const lines = toLines(units, opts.maxLineWidth, opts.measure ?? countGraphemes)
  const blocks: TextBlock[] = []
  for (let i = 0; i < lines.length; i += opts.linesPerBlock) {
    blocks.push(toBlock(lines.slice(i, i + opts.linesPerBlock)))
  }
  return blocks
}

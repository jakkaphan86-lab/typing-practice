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
  /** Code-point range of the whole word within the block. */
  start: number
  end: number
  clusters: readonly ClusterInfo[]
}

export interface LineInfo {
  words: readonly WordInfo[]
}

/** A static page of text: a few lines that are typed, then swapped out. */
export interface TextBlock {
  /** Code points the user must type (one keystroke each). */
  chars: readonly string[]
  clusters: readonly ClusterInfo[]
  words: readonly WordInfo[]
  lines: readonly LineInfo[]
  /** chars[i] belongs to clusters[charToCluster[i]]. */
  charToCluster: readonly number[]
  /** clusters[i] belongs to words[clusterToWord[i]]. */
  clusterToWord: readonly number[]
}

/** Measures a string's width (px, or characters for the fallback). */
export type MeasureText = (text: string) => number

export interface BlockOptions {
  locale: string
  linesPerBlock: number
  /** Max line width, in the same unit `measure` returns. */
  maxLineWidth: number
  /** Defaults to grapheme count (combining marks have no width). */
  measure?: MeasureText
}

const countGraphemes: MeasureText = (text) => splitGraphemes(text).length

/** Normalize raw passage text: NFC, collapse whitespace/newlines into single spaces. */
function normalizeText(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim()
}

const endsWithSpace = (unit: readonly WordSegment[]) => isWhitespace(unit.at(-1)?.text ?? ' ')

/**
 * Group word segments into unbreakable "units": a word plus any punctuation
 * glued to it plus its trailing space. Lines may only break between units.
 */
function toUnits(segments: readonly WordSegment[]): WordSegment[][] {
  const units: WordSegment[][] = []
  for (const seg of segments) {
    const prev = units.at(-1)
    if (!prev || (!isWhitespace(seg.text) && (endsWithSpace(prev) || seg.isWordLike))) units.push([seg])
    else prev.push(seg)
  }
  return units
}

/** Greedy line wrapping; a unit's trailing space may hang past the edge. */
function toLines(units: readonly WordSegment[][], maxWidth: number, measure: MeasureText): WordSegment[][] {
  const lines: WordSegment[][] = []
  let line: WordSegment[] = []
  let width = 0
  for (const unit of units) {
    const unitText = unit.map((s) => s.text).join('')
    if (line.length > 0 && width + measure(unitText.trimEnd()) > maxWidth) {
      lines.push(line)
      line = []
      width = 0
    }
    line.push(...unit)
    width += measure(unitText)
  }
  if (line.length > 0) lines.push(line)
  return lines
}

function toBlock(lines: readonly WordSegment[][]): TextBlock {
  const chars: string[] = []
  const clusters: ClusterInfo[] = []
  const words: WordInfo[] = []
  const charToCluster: number[] = []
  const clusterToWord: number[] = []

  const lineInfos: LineInfo[] = lines.map((line) => ({
    words: line.map((seg) => {
      const id = words.length
      const start = chars.length
      const wordClusters: ClusterInfo[] = []
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
        clusterToWord.push(id)
        wordClusters.push(cluster)
      }
      const word: WordInfo = { id, wordLike: seg.isWordLike, start, end: chars.length, clusters: wordClusters }
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

/**
 * The word to highlight: the one under the cursor, or — when the cursor sits
 * on a space or punctuation — the next real word. -1 when there is none.
 */
export function findCurrentWordId(block: TextBlock, cursor: number): number {
  const cluster = block.charToCluster[cursor]
  if (cluster === undefined) return -1
  let id = block.clusterToWord[cluster] ?? -1
  while (id >= 0 && id < block.words.length && !block.words[id]?.wordLike) id++
  return id < block.words.length ? id : -1
}

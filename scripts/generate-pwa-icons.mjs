/**
 * Procedurally generates the PWA icons (public/pwa-192x192.svg, public/pwa-512x512.svg):
 * a white keycap with a "T" on an amber tile. The "T" is drawn with shapes, not
 * text, so the icon never depends on a font being available.
 *
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const COLORS = {
  tile: '#f59e0b', // amber-500
  keyShadow: '#b45309', // amber-700
  key: '#ffffff',
  letter: '#1e293b', // slate-800
}

// All geometry on a 512-unit grid; the output size only changes width/height.
const GRID = 512
const key = { x: 104, y: 96, w: 304, h: 296, r: 56, depth: 24 }
const stroke = 44 // thickness of the T
const bar = { x: 172, y: 168, w: 168 }
const stemHeight = 168

function icon(size) {
  const stemX = GRID / 2 - stroke / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${GRID} ${GRID}" role="img" aria-label="Typing Practice">
  <rect width="${GRID}" height="${GRID}" rx="112" fill="${COLORS.tile}"/>
  <rect x="${key.x}" y="${key.y + key.depth}" width="${key.w}" height="${key.h}" rx="${key.r}" fill="${COLORS.keyShadow}"/>
  <rect x="${key.x}" y="${key.y}" width="${key.w}" height="${key.h}" rx="${key.r}" fill="${COLORS.key}"/>
  <rect x="${bar.x}" y="${bar.y}" width="${bar.w}" height="${stroke}" rx="10" fill="${COLORS.letter}"/>
  <rect x="${stemX}" y="${bar.y}" width="${stroke}" height="${stemHeight}" rx="10" fill="${COLORS.letter}"/>
</svg>
`
}

for (const size of [192, 512]) {
  const path = fileURLToPath(new URL(`../public/pwa-${size}x${size}.svg`, import.meta.url))
  writeFileSync(path, icon(size))
  console.log(`wrote ${path}`)
}

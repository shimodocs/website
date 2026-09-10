// Inline SVG figure generators for blog articles.
//
// Figures are produced at build time from a small declarative spec inside a
// fenced block, so an article can carry real diagrams without the author
// hand-writing SVG and without shipping image requests. The markup is inline,
// which also means the labels are crawlable text rather than pixels.
//
// Every figure carries an accessible name and a caption.

const PALETTE = {
  ink: '#f7f4ff',
  muted: '#a8a3c2',
  faint: '#6f6a86',
  line: '#ffffff26',
  card: '#ffffff0f',
  cardStrong: '#ffffff17',
  violet: '#8b6cf2',
  cyan: '#00f0ff',
  pink: '#ff4b9b',
  green: '#4bd6a0',
  amber: '#f0b45c',
}

const ACCENTS = [PALETTE.violet, PALETTE.cyan, PALETTE.pink, PALETTE.green, PALETTE.amber]

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function splitList(value) {
  if (!value) return []
  return String(value)
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
}

/**
 * Greedy word wrap into at most `maxLines` lines of roughly `perLine` chars.
 */
function wrap(text, perLine, maxLines = 3) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > perLine && current) {
      lines.push(current)
      current = word
      if (lines.length === maxLines) break
    } else {
      current = candidate
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines && words.length) {
    // Signal truncation rather than silently dropping words.
    const joined = lines.join(' ')
    if (joined.split(/\s+/).length < words.length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:]$/, '')}…`
    }
  }
  return lines
}

/** Simpler: emit one <text> per line to avoid tspan offset mistakes. */
function lines(x, y, content, { size = 15, fill = PALETTE.ink, weight = 500, anchor = 'middle', lead = 1.3 } = {}) {
  const step = size * lead
  return content
    .map(
      (line, index) =>
        `<text x="${x}" y="${(y + index * step).toFixed(1)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`,
    )
    .join('')
}

function title(spec, width) {
  if (!spec.title) return ''
  return lines(width / 2, 24, [spec.title], { size: 17, weight: 600, fill: PALETTE.ink })
}

function caption(spec) {
  if (!spec.caption) return ''
  return `<figcaption>${esc(spec.caption)}</figcaption>`
}

// ------------------------------------------------------------------ flow

function flow(spec) {
  const items = splitList(spec.items)
  const detail = splitList(spec.detail)
  const width = 960
  const gap = 26
  const boxW = (width - gap * (items.length - 1)) / items.length
  const boxH = 108
  const top = 58
  const height = top + boxH + 34

  const parts = items.map((item, index) => {
    const x = index * (boxW + gap)
    const accent = ACCENTS[index % ACCENTS.length]
    const label = wrap(item, 20, 2)
    const sub = detail[index] ? wrap(detail[index], 26, 2) : []
    return `
      <g>
        <rect x="${x.toFixed(1)}" y="${top}" width="${boxW.toFixed(1)}" height="${boxH}" rx="14" fill="${PALETTE.card}" stroke="${PALETTE.line}"/>
        <rect x="${x.toFixed(1)}" y="${top}" width="${boxW.toFixed(1)}" height="4" rx="2" fill="${accent}"/>
        <circle cx="${(x + 22).toFixed(1)}" cy="${top + 32}" r="13" fill="${accent}1f" stroke="${accent}" stroke-width="1.2"/>
        <text x="${(x + 22).toFixed(1)}" y="${top + 37}" text-anchor="middle" font-size="13" font-weight="600" fill="${accent}">${index + 1}</text>
        ${lines(x + boxW / 2, top + 62, label, { size: 14, weight: 600 })}
        ${sub.length ? lines(x + boxW / 2, top + 82 + (label.length - 1) * 18, sub, { size: 11.5, fill: PALETTE.muted, weight: 400 }) : ''}
      </g>`
  })

  const arrows = items
    .slice(0, -1)
    .map((_, index) => {
      const x = (index + 1) * boxW + index * gap + gap / 2
      const y = top + boxH / 2
      return `<path d="M${(x - 7).toFixed(1)} ${y} h11" stroke="${PALETTE.faint}" stroke-width="1.6"/><path d="M${(x + 4).toFixed(1)} ${y - 4} l5 4 -5 4z" fill="${PALETTE.faint}"/>`
    })
    .join('')

  return svg(width, height, spec, `${title(spec, width)}${parts.join('')}${arrows}`)
}

// ---------------------------------------------------------------- layers

function layers(spec) {
  const items = splitList(spec.items)
  const detail = splitList(spec.detail)
  const width = 960
  const rowH = 58
  const gap = 12
  const top = 58
  const left = 26
  const innerW = width - left * 2
  const height = top + items.length * (rowH + gap) + 18

  const rows = items.map((item, index) => {
    const y = top + index * (rowH + gap)
    const accent = ACCENTS[index % ACCENTS.length]
    const inset = index * 26
    return `
      <g>
        <rect x="${left + inset / 2}" y="${y}" width="${innerW - inset}" height="${rowH}" rx="12" fill="${PALETTE.card}" stroke="${PALETTE.line}"/>
        <rect x="${left + inset / 2}" y="${y}" width="4" height="${rowH}" rx="2" fill="${accent}"/>
        <text x="${left + inset / 2 + 22}" y="${y + 25}" font-size="14.5" font-weight="600" fill="${PALETTE.ink}">${esc(item)}</text>
        ${detail[index] ? `<text x="${left + inset / 2 + 22}" y="${y + 44}" font-size="12" font-weight="400" fill="${PALETTE.muted}">${esc(detail[index])}</text>` : ''}
      </g>`
  })

  return svg(width, height, spec, `${title(spec, width)}${rows.join('')}`)
}

// -------------------------------------------------------------- compare

function compare(spec) {
  const left = spec.left || 'Option A'
  const right = spec.right || 'Option B'
  const leftItems = splitList(spec.leftItems)
  const rightItems = splitList(spec.rightItems)
  const width = 960
  const colW = (width - 26 * 2 - 24) / 2
  const top = 74
  const rowH = 40
  const rows = Math.max(leftItems.length, rightItems.length)
  const height = top + rows * rowH + 34

  const column = (x, heading, items, accent, sign) => {
    const body = items
      .map(
        (item, index) => `
        <g>
          <text x="${x + 16}" y="${top + 34 + index * rowH}" font-size="13.5" font-weight="600" fill="${accent}">${sign}</text>
          <text x="${x + 34}" y="${top + 34 + index * rowH}" font-size="13" font-weight="400" fill="${PALETTE.muted}">${esc(wrap(item, 34, 1)[0] ?? '')}</text>
        </g>`,
      )
      .join('')
    return `
      <g>
        <rect x="${x}" y="${top - 46}" width="${colW}" height="${rows * rowH + 62}" rx="14" fill="${PALETTE.card}" stroke="${PALETTE.line}"/>
        <text x="${x + 16}" y="${top - 20}" font-size="14" font-weight="600" fill="${PALETTE.ink}">${esc(heading)}</text>
        <line x1="${x + 16}" y1="${top - 10}" x2="${x + colW - 16}" y2="${top - 10}" stroke="${PALETTE.line}"/>
        ${body}
      </g>`
  }

  return svg(
    width,
    height,
    spec,
    `${title(spec, width)}${column(26, left, leftItems, PALETTE.green, '✓')}${column(26 + colW + 24, right, rightItems, PALETTE.pink, '✕')}`,
  )
}

// ----------------------------------------------------------------- bars

function bars(spec) {
  const items = splitList(spec.items)
  const values = splitList(spec.value).map(Number)
  const captions = splitList(spec.detail)
  const width = 960
  const left = 250
  const right = 90
  const barMax = width - left - right - 40
  const rowH = 44
  const top = 62
  const max = Math.max(...values.filter(Number.isFinite), 1)
  const height = top + items.length * rowH + 24

  const rows = items
    .map((item, index) => {
      const value = Number.isFinite(values[index]) ? values[index] : 0
      const w = Math.max(6, (value / max) * barMax)
      const y = top + index * rowH
      const accent = ACCENTS[index % ACCENTS.length]
      return `
        <g>
          <text x="${left - 16}" y="${y + 20}" text-anchor="end" font-size="13" font-weight="500" fill="${PALETTE.ink}">${esc(wrap(item, 28, 1)[0] ?? '')}</text>
          <rect x="${left}" y="${y + 6}" width="${barMax}" height="20" rx="10" fill="${PALETTE.card}"/>
          <rect x="${left}" y="${y + 6}" width="${w.toFixed(1)}" height="20" rx="10" fill="${accent}" opacity="0.85"/>
          <text x="${left + w + 12}" y="${y + 21}" font-size="12.5" font-weight="600" fill="${PALETTE.ink}">${esc(captions[index] || String(value))}</text>
        </g>`
    })
    .join('')

  return svg(width, height, spec, `${title(spec, width)}${rows}`)
}

// --------------------------------------------------------------- matrix

function matrix(spec) {
  const quadrants = splitList(spec.items)
  const detail = splitList(spec.detail)
  const width = 960
  const top = 76
  const boxW = (width - 26 * 2 - 18) / 2
  const boxH = 132
  const height = top + boxH * 2 + 18 + 30

  const cells = quadrants.map((item, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = 26 + col * (boxW + 18)
    const y = top + row * (boxH + 18)
    const accent = ACCENTS[[0, 1, 3, 2][index] ?? index]
    return `
      <g>
        <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="14" fill="${PALETTE.card}" stroke="${PALETTE.line}"/>
        <circle cx="${x + 22}" cy="${y + 24}" r="6" fill="${accent}"/>
        <text x="${x + 40}" y="${y + 29}" font-size="14.5" font-weight="600" fill="${PALETTE.ink}">${esc(item)}</text>
        ${detail[index] ? lines(x + 22, y + 62, wrap(detail[index], 46, 3), { size: 12.5, fill: PALETTE.muted, weight: 400, anchor: 'start', lead: 1.45 }) : ''}
      </g>`
  })

  const axis = `
    <text x="${26}" y="${top - 32}" font-size="11" font-weight="600" fill="${PALETTE.faint}" letter-spacing="1.4">${esc(spec.xAxis || '')}</text>
    <text x="${width - 26}" y="${top - 32}" text-anchor="end" font-size="11" font-weight="600" fill="${PALETTE.faint}" letter-spacing="1.4">${esc(spec.xAxisEnd || '')}</text>`

  return svg(width, height, spec, `${title(spec, width)}${axis}${cells.join('')}`)
}

// ------------------------------------------------------------- timeline

function timeline(spec) {
  const items = splitList(spec.items)
  const detail = splitList(spec.detail)
  const width = 960
  const top = 66
  const rowH = 74
  const railX = 120
  const height = top + items.length * rowH + 10

  const rows = items
    .map((item, index) => {
      const y = top + index * rowH
      const accent = ACCENTS[index % ACCENTS.length]
      return `
        <g>
          <line x1="${railX}" y1="${y}" x2="${railX}" y2="${y + rowH}" stroke="${PALETTE.line}"/>
          <circle cx="${railX}" cy="${y + 16}" r="8" fill="${PALETTE.cardStrong}" stroke="${accent}" stroke-width="1.6"/>
          <text x="${railX - 20}" y="${y + 21}" text-anchor="end" font-size="12" font-weight="600" fill="${accent}">${String(index + 1).padStart(2, '0')}</text>
          <text x="${railX + 26}" y="${y + 21}" font-size="14.5" font-weight="600" fill="${PALETTE.ink}">${esc(wrap(item, 56, 1)[0] ?? '')}</text>
          ${detail[index] ? `<text x="${railX + 26}" y="${y + 43}" font-size="12.5" font-weight="400" fill="${PALETTE.muted}">${esc(wrap(detail[index], 82, 1)[0] ?? '')}</text>` : ''}
        </g>`
    })
    .join('')

  return svg(width, height, spec, `${title(spec, width)}${rows}`)
}

// ------------------------------------------------------------ screenshot

function screenshot(spec) {
  const src = spec.src || ''
  const alt = spec.alt || spec.caption || spec.title || 'ShimoDocs product screenshot'
  return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" width="${esc(spec.width || 1714)}" height="${esc(spec.height || 918)}"/>`
}

function svg(width, height, spec, body) {
  const label = spec.title || spec.caption || 'Diagram'
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
}

const GENERATORS = { flow, layers, compare, bars, matrix, timeline, screenshot }

export const FIGURE_TYPES = Object.keys(GENERATORS)

export function renderFigure(spec) {
  const type = (spec.type || 'flow').trim()
  const generator = GENERATORS[type]
  if (!generator) {
    throw new Error(`Unknown figure type "${type}". Known types: ${FIGURE_TYPES.join(', ')}`)
  }
  const body = generator(spec)
  const wide = type === 'bars' || type === 'matrix' || type === 'compare' || type === 'timeline' ? ' fig-wide' : ''
  return `<figure class="fig fig-${type}${wide}">${body}${caption(spec)}</figure>`
}

// ------------------------------------------------------- other block types

export function renderCallout(spec, inner) {
  const tone = spec.tone || 'note'
  const label = spec.title || { note: 'Note', warning: 'Watch out', tip: 'In practice' }[tone] || 'Note'
  return `<aside class="callout callout-${esc(tone)}"><b>${esc(label)}</b><div>${inner}</div></aside>`
}

export function renderKeyPoints(spec, inner) {
  const label = spec.title || 'Key points'
  return `<aside class="keypoints"><b>${esc(label)}</b><div>${inner}</div></aside>`
}

export function renderPullQuote(spec, inner) {
  return `<blockquote class="pullquote">${inner}</blockquote>`
}

export const BLOCK_TYPES = ['figure', 'callout', 'keypoints', 'pullquote']

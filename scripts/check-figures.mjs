#!/usr/bin/env node
// Figure health check.
//
// Every diagram on the site is inline SVG generated at build time from a small
// spec in the article's Markdown. The generators place text by coordinate, and
// SVG has no layout engine: a label that runs past the viewBox is not wrapped,
// shrunk or scrolled — it is simply not painted. The figure still looks like a
// figure, the build stays green, and the reader has no way to tell that a row of
// a bar chart lost its label.
//
// That is how it shipped for a while. A `bars` label sat at the end of its bar
// and the longest bar was the one with the longest label, so exactly the row
// that needed explaining lost its words; `layers` and `flow` had the same
// problem where a fixed character count outran a box that had become narrower.
//
// The generators now wrap to the room they actually have. This is the check that
// they still do, on every page the build wrote:
//
//   node scripts/check-figures.mjs dist
import { pathToFileURL } from 'node:url'
import { overflowingFigureText } from './figures.mjs'
import { readHtmlPages } from './page-text.mjs'

export function auditFigures(pages) {
  const problems = []
  const stats = { pages: 0, pagesWithFigures: 0, figures: 0, labels: 0 }

  for (const { label, html } of pages) {
    stats.pages += 1
    const figureCount = [...html.matchAll(/<figure class="fig /g)].length
    if (!figureCount) continue
    stats.pagesWithFigures += 1
    stats.figures += figureCount
    stats.labels += [...html.matchAll(/<svg viewBox="0 0 \d+ \d+"[\s\S]*?<\/svg>/g)].length
    for (const overflow of overflowingFigureText(html)) {
      problems.push(
        `${label}: figure text runs ${overflow.over}px past the edge of the diagram and is not painted: ` +
          `"${overflow.text}"`,
      )
    }
  }

  return { problems, stats }
}

export function auditFiguresInDirectory(distDir) {
  return auditFigures(readHtmlPages(distDir))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const distDir = process.argv[2] || 'dist'
  const { problems, stats } = auditFiguresInDirectory(distDir)
  console.log(
    `Figure check: ${stats.figures} figures on ${stats.pagesWithFigures} of ${stats.pages} pages.`,
  )
  if (problems.length) {
    console.error('Figure check failed:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log('Figure check passed: every figure label is painted inside its diagram.')
}

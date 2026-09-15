#!/usr/bin/env node
// What a reader can actually see on a prerendered page.
//
// Shared by the content checks (scripts/check-faq.mjs, and the pricing-fact
// check) because they all need the same two things: the text with the
// structured data removed, and a comparison that is not thrown off by entity
// encoding or a line break.
//
// Stripping <script> is the part that matters. The JSON-LD of a page contains
// the very strings these checks search for, so any check that searched the raw
// HTML would match the markup against itself and pass forever.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  times: '×',
  middot: '·',
  copy: '©',
  rarr: '→',
  deg: '°',
}

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
}

// Whitespace is collapsed so a line break in the source is not a mismatch, but
// a reworded sentence still is.
export function normaliseText(text) {
  return decodeEntities(String(text)).replace(/\s+/g, ' ').trim()
}

// Everything a reader can see: no <head>, no <script>, no tags.
//
// Comments are removed before the tags are: React writes `<!-- -->` between a
// text node and an interpolated expression, so "$<!-- -->5 per user" would
// otherwise compare as "$ 5 per user" and a check for the price would miss it.
export function visibleText(html) {
  return normaliseText(
    html
      .replace(/<head[\s\S]*?<\/head>/i, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' '),
  )
}

// Every JSON-LD block on the page, parsed. Unparsable blocks are reported rather
// than skipped: a typo in one block is invisible to a crawler and to whoever
// edited the page.
export function jsonLdDocuments(html) {
  const documents = []
  const parseErrors = []
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      documents.push(JSON.parse(match[1]))
    } catch (error) {
      parseErrors.push(String(error).split('\n')[0])
    }
  }
  return { documents, parseErrors }
}

// Depth-first search for every node of a given @type, because the nodes that
// matter are nested (the pricing Offer lives inside the product's offers array).
export function findNodes(value, type, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) findNodes(item, type, found)
  } else if (value && typeof value === 'object') {
    if (value['@type'] === type) found.push(value)
    for (const child of Object.values(value)) findNodes(child, type, found)
  }
  return found
}

// Every page of a built directory, as { label, html }. Used by the standalone
// mode of each check so it can be pointed at a release that is already online.
export function readHtmlPages(distDir) {
  const pages = []
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.html')) {
        const route = '/' + relative(distDir, full).replace(/index\.html$/, '').replace(/\/$/, '')
        pages.push({ label: route || '/', html: readFileSync(full, 'utf8') })
      }
    }
  }
  walk(distDir)
  return pages
}

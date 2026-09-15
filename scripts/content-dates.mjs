#!/usr/bin/env node
// When a page's content last changed, for the sitemap's <lastmod>.
//
// The sitemaps used to stamp every URL with the build date. That is worse than
// no lastmod at all: every rebuild claimed all ~240 URLs had changed, Google
// learns the field carries no information on this domain, and a guide that
// genuinely changed stops getting crawl credit for it. These dates come from
// the file that holds the content — the guide Markdown on disk — through one
// `git log` call per path.
//
// Git rather than the file's mtime, because a fresh checkout sets every mtime to
// the moment of the clone: that reproduces exactly the all-today problem this
// module exists to remove. Both workflows check out with fetch-depth: 0 so the
// history is there at build time. The mtime is only the fallback for a build
// from an export with no .git directory at all; a build that silently takes that
// path is caught by the sitemap check in scripts/prerender.mjs.
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const cache = new Map()

let gitWorks = true

function gitDate(relativePath) {
  if (!gitWorks) return null
  try {
    const output = execFileSync('git', ['log', '-1', '--format=%cs', '--', relativePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    // Empty output means the path is untracked, or the history is too shallow
    // to contain the commit that last touched it.
    return ISO_DATE.test(output) ? output : null
  } catch {
    // Not a git checkout, or git is not installed. Every path takes the mtime
    // fallback from here on, so the failed lookup is not retried per file.
    gitWorks = false
    return null
  }
}

function mtimeDate(relativePath) {
  try {
    return statSync(join(rootDir, relativePath)).mtime.toISOString().slice(0, 10)
  } catch {
    return null
  }
}

// Returns YYYY-MM-DD, or null when the path exists in neither git nor the
// working tree. The caller decides what a missing date means; the sitemap
// builder treats it as a build failure rather than inventing a date.
export function contentDate(relativePath) {
  if (!relativePath) return null
  if (!cache.has(relativePath)) {
    cache.set(relativePath, gitDate(relativePath) || mtimeDate(relativePath))
  }
  return cache.get(relativePath)
}

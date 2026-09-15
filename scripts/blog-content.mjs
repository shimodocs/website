// Blog content pipeline.
//
// Articles live as Markdown under content/blog. This module is the single
// reader used by both the generator that emits the client-side metadata module
// and the prerenderer that renders each article to static HTML, so a post can
// never appear in one place and be missing in the other.
//
// Markdown is only ever converted at build time. Neither markdown-it nor the
// raw source reaches the browser bundle.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { BLOCK_TYPES, renderCallout, renderFigure, renderKeyPoints, renderPullQuote } from './figures.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const CONTENT_DIR = join(rootDir, 'content', 'blog')

// Categories drive the listing filters, the article breadcrumb and the
// archive grouping. Order here is the order they appear in the UI.
export const CATEGORIES = [
  {
    id: 'comparisons',
    label: 'Comparisons',
    description: 'How ShimoDocs compares with Google Docs, Notion, Confluence and other collaboration tools.',
  },
  {
    id: 'self-hosting',
    label: 'Self-hosting',
    description: 'Deploying and running document collaboration on infrastructure you control.',
  },
  {
    id: 'security',
    label: 'Security & compliance',
    description: 'Data sovereignty, access control and the compliance questions teams ask before migrating.',
  },
  {
    id: 'ai',
    label: 'AI at work',
    description: 'Putting AI agents inside documents without handing your content to someone else.',
  },
  {
    id: 'industry',
    label: 'Industry',
    description: 'Secure collaboration for finance, healthcare, legal, government and other regulated teams.',
  },
  {
    id: 'guides',
    label: 'Guides & workflows',
    description: 'Practical walkthroughs for teams moving work into a private cloud workspace.',
  },
]

const CATEGORY_IDS = new Set(CATEGORIES.map(category => category.id))

// Article layouts. Each renders a genuinely different document structure, not
// just a different stylesheet, so the archive does not look like one template
// repeated a hundred times.
export const LAYOUTS = ['standard', 'feature', 'briefing', 'magazine']

export const DEFAULT_LAYOUT = 'standard'

export function categoryById(id) {
  return CATEGORIES.find(category => category.id === id) || null
}

// ---------------------------------------------------------------- markdown

// GitHub-style heading slugs, deduplicated within a document.
export function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function headingAnchorsPlugin(md) {
  md.core.ruler.push('collect_headings', state => {
    const used = new Map()
    state.env.headings = state.env.headings || []

    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index]
      if (token.type !== 'heading_open') continue
      const level = Number(token.tag.slice(1))
      if (level !== 2 && level !== 3) continue

      const inline = state.tokens[index + 1]
      const text = inline?.content?.trim() || ''
      if (!text) continue

      let id = slugifyHeading(text)
      const seen = used.get(id) || 0
      used.set(id, seen + 1)
      if (seen > 0) id = `${id}-${seen + 1}`

      token.attrSet('id', id)
      state.env.headings.push({ level, id, text: text.replace(/`/g, '') })
    }
  })
}

function externalLinksPlugin(md) {
  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    ((tokens, index, options, env, self) => self.renderToken(tokens, index, options))

  md.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const href = tokens[index].attrGet('href') || ''
    if (/^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?shimodocs\.com/i.test(href)) {
      tokens[index].attrSet('target', '_blank')
      tokens[index].attrSet('rel', 'noreferrer')
    }
    return defaultLinkOpen(tokens, index, options, env, self)
  }
}

// Fenced blocks let an article carry diagrams and aside components without
// hand-written HTML. The first paragraph of key/value lines is the spec; what
// follows a blank line is markdown body content.
export function parseBlock(content) {
  const raw = String(content).split('\n')
  const spec = {}
  let index = 0
  for (; index < raw.length; index += 1) {
    const line = raw[index]
    if (!line.trim()) {
      index += 1
      break
    }
    const match = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/)
    if (!match) break
    spec[match[1]] = match[2].trim()
  }
  return { spec, body: raw.slice(index).join('\n').trim() }
}

function blockPlugin(md) {
  const defaultFence =
    md.renderer.rules.fence || ((tokens, index, options, env, self) => self.renderToken(tokens, index, options))

  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]
    const language = (token.info || '').trim().split(/\s+/)[0]
    if (!BLOCK_TYPES.includes(language)) return defaultFence(tokens, index, options, env, self)

    const { spec, body } = parseBlock(token.content)
    switch (language) {
      case 'figure':
        return renderFigure(spec)
      case 'callout':
        return renderCallout(spec, body ? md.render(body) : '')
      case 'keypoints':
        return renderKeyPoints(spec, body ? md.render(body) : '')
      case 'pullquote':
        return renderPullQuote(spec, body ? md.renderInline(body) : '')
      default:
        return defaultFence(tokens, index, options, env, self)
    }
  }
}

// A plain, predictable renderer: no raw HTML from authors, tables and
// typographic replacement on, linkification for bare URLs.
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
})
  .use(blockPlugin)
  .use(headingAnchorsPlugin)
  .use(externalLinksPlugin)

export function renderMarkdown(source) {
  const env = { headings: [] }
  const html = md.render(source, env)
  return { html, headings: env.headings }
}

// ------------------------------------------------------------------- posts

function countWords(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`|\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

function requireString(data, field, file) {
  const value = data[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${file}: frontmatter is missing a "${field}" string`)
  }
  return value.trim()
}

function toIsoDate(value, field, file) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const text = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${file}: frontmatter "${field}" must be YYYY-MM-DD, received "${text}"`)
  }
  return text
}

function loadPost(fileName) {
  const file = join(CONTENT_DIR, fileName)
  const raw = readFileSync(file, 'utf8')
  const { data, content } = matter(raw)

  const slug = fileName.replace(/\.md$/, '')
  const title = requireString(data, 'title', fileName)
  const description = requireString(data, 'description', fileName)
  const category = requireString(data, 'category', fileName)

  if (!CATEGORY_IDS.has(category)) {
    throw new Error(
      `${fileName}: unknown category "${category}". Expected one of ${[...CATEGORY_IDS].join(', ')}`,
    )
  }
  if (description.length > 160) {
    throw new Error(`${fileName}: description is ${description.length} chars, max 160 for search results`)
  }
  if (title.length > 70) {
    throw new Error(`${fileName}: title is ${title.length} chars, too long for a search result`)
  }

  const layout = String(data.layout || DEFAULT_LAYOUT).trim()
  if (!LAYOUTS.includes(layout)) {
    throw new Error(`${fileName}: unknown layout "${layout}". Expected one of ${LAYOUTS.join(', ')}`)
  }

  const { html, headings } = renderMarkdown(content)
  const words = countWords(content)
  const figures = (html.match(/class="fig\b/g) || []).length
  if (figures < 1) {
    throw new Error(`${fileName}: every article needs at least one figure block`)
  }

  // The H1 is written for a reader; the search result title is written for a
  // query. When the H1 is already short enough the brand suffix is appended
  // automatically, otherwise the author must supply an explicit seoTitle.
  const seoTitle = String(data.seoTitle || '').trim() || `${title} | ShimoDocs`
  if (seoTitle.length > 62) {
    throw new Error(
      `${fileName}: search title is ${seoTitle.length} chars (max 62). Add a shorter "seoTitle" to the frontmatter.`,
    )
  }

  // Frequently asked questions. Written in the frontmatter so one source feeds
  // both the visible FAQ section and the FAQPage structured data. The questions
  // are still ordinary markdown in the body; the loop below refuses a build
  // where the frontmatter and the body have drifted apart.
  const faq = Array.isArray(data.faq)
    ? data.faq.map((entry, index) => ({
        question: requireString(entry || {}, 'question', `${fileName} faq entry ${index + 1}`),
        answer: requireString(entry || {}, 'answer', `${fileName} faq entry ${index + 1}`),
      }))
    : []
  for (const entry of faq) {
    if (!html.includes(entry.question)) {
      throw new Error(
        `${fileName}: the faq question "${entry.question}" is in the frontmatter but not in the article body`,
      )
    }
  }

  return {
    slug,
    file: `content/blog/${fileName}`,
    title,
    seoTitle,
    faq,
    description,
    category,
    categoryLabel: categoryById(category).label,
    date: toIsoDate(data.date, 'date', fileName),
    updated: data.updated ? toIsoDate(data.updated, 'updated', fileName) : null,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    keywords: typeof data.keywords === 'string' ? data.keywords : '',
    author: typeof data.author === 'string' ? data.author : 'ShimoDocs Team',
    featured: data.featured === true,
    // Optional social card published with the article. Empty means "use the
    // shared site card", which is what every article did before.
    image: typeof data.image === 'string' ? data.image.trim() : '',
    layout,
    figures,
    words,
    readingTime: Math.max(1, Math.round(words / 220)),
    headings,
    html,
  }
}

function assertInternalLinksResolve(posts, bySlug) {
  const problems = []
  for (const post of posts) {
    for (const match of post.html.matchAll(/href="\/blog\/([a-z0-9-]+)"/g)) {
      if (!bySlug.has(match[1])) {
        problems.push(`${post.file}: links to /blog/${match[1]} which does not exist`)
      }
    }
  }
  return problems
}

export function loadPosts() {
  if (!existsSync(CONTENT_DIR)) return []

  const files = readdirSync(CONTENT_DIR)
    .filter(name => name.endsWith('.md'))
    .sort()

  const posts = files.map(loadPost)

  const seen = new Set()
  for (const post of posts) {
    if (seen.has(post.slug)) throw new Error(`Duplicate blog slug "${post.slug}"`)
    seen.add(post.slug)
  }

  // Newest first, so the listing and the RSS-style ordering are stable.
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)))

  const bySlug = new Map(posts.map(post => [post.slug, post]))
  const brokenLinks = assertInternalLinksResolve(posts, bySlug)
  if (brokenLinks.length) {
    throw new Error(`Broken internal blog links:\n  ${brokenLinks.join('\n  ')}`)
  }

  return posts
}

// Related reading: same category first, then shared tags, then recency. Gives
// every article an outbound set of contextual internal links, which the
// previous site's articles had none of.
export function relatedPosts(post, posts, limit = 4) {
  const candidates = posts.filter(candidate => candidate.slug !== post.slug)
  const scored = candidates
    .map(candidate => {
      const sharedTags = candidate.tags.filter(tag => post.tags.includes(tag)).length
      const sameCategory = candidate.category === post.category ? 1 : 0
      return { candidate, score: sameCategory * 10 + sharedTags }
    })
    .sort((a, b) => (b.score - a.score) || (a.candidate.date < b.candidate.date ? 1 : -1))

  // Fall back to recency so a post with no tag overlap still links out to a
  // full set of related reading. An orphan article helps nobody.
  return scored.slice(0, limit).map(entry => entry.candidate)
}

// Metadata published to the client bundle: everything the listing needs and
// nothing else. Article bodies stay out of the browser entirely.
export function toClientRecord(post) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    categoryLabel: post.categoryLabel,
    layout: post.layout,
    figures: post.figures,
    date: post.date,
    updated: post.updated,
    tags: post.tags,
    readingTime: post.readingTime,
    words: post.words,
    featured: post.featured,
  }
}

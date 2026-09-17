#!/usr/bin/env node
// Validate one draft article through the real content pipeline.
//
// Writing an article means writing front matter and figure blocks against rules
// this repo enforces at build time — description length, layout name, category
// name, figure type, at least one figure. Finding out at the end of a full build
// is slow and, when several articles are in flight at once, the build files are
// shared. This reads one file with the same code path the build uses and writes
// nothing.
//
// Usage: node scripts/check-article-draft.mjs content/blog/<slug>.md
import { relative } from 'node:path'
import { loadPost } from './blog-content.mjs'
import { FIGURE_TYPES } from './figures.mjs'

const target = process.argv[2]
if (!target) {
  console.error('Usage: node scripts/check-article-draft.mjs content/blog/<slug>.md')
  process.exit(1)
}

const fileName = relative('content/blog', target).replace(/^.*?([^/]+\.md)$/, '$1')

try {
  const post = loadPost(fileName)
  const blocks = [...post.html.matchAll(/class="fig fig-([a-z]+)/g)].map(match => match[1])
  const blockKinds = ['callout', 'keypoints', 'pullquote'].filter(kind => post.html.includes(`class="${kind}`))
  console.log(`ok       ${post.slug}`)
  console.log(`         layout    ${post.layout}`)
  console.log(`         category  ${post.category} (${post.categoryLabel})`)
  console.log(`         title     ${post.title.length} chars, seoTitle ${post.seoTitle.length} chars`)
  console.log(`         desc      ${post.description.length}/160 chars`)
  console.log(`         body      ${post.words} words, ${post.figures} figures`)
  console.log(`         figures   ${blocks.join(', ') || 'none'}`)
  console.log(`         blocks    ${blockKinds.join(', ') || 'none'}`)
  console.log(`         faq       ${post.faq.length}`)
  if (post.headings?.length) console.log(`         h2s       ${post.headings.length}`)
} catch (error) {
  console.error(`FAIL     ${error.message}`)
  console.error(`         known figure types: ${FIGURE_TYPES.join(', ')}`)
  process.exit(1)
}

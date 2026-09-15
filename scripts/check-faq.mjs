#!/usr/bin/env node
// FAQ health check.
//
// The FAQ on a page exists twice: once as text a reader sees, once as FAQPage
// structured data a crawler reads. Google's rule for the markup is that it must
// describe content that is visible on the page, so the two copies have to say
// the same thing — and until this module existed nothing checked that. The build
// only asked whether each declared *question* appeared somewhere in the HTML;
// an answer could be rewritten, or stale, or simply wrong, and the build stayed
// green.
//
// The whole comparison depends on one detail: the answer text is inside the
// JSON-LD of the same document, so searching the raw HTML for it always
// succeeds. Every check here strips <script> first and compares against the
// rendered text, entity-decoded and whitespace-normalised. A check that skipped
// that step would pass forever and be worse than no check at all.
//
// Used by scripts/prerender.mjs on every page this build wrote, and runnable on
// its own against a built directory or a live release:
//
//   node scripts/check-faq.mjs dist
import { pathToFileURL } from 'node:url'
import { normaliseText, readHtmlPages, visibleText } from './page-text.mjs'

// Every FAQPage node in the document, in the order it is declared, plus any
// JSON-LD block that failed to parse.
export function faqNodes(html) {
  const nodes = []
  const parseErrors = []
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data
    try {
      data = JSON.parse(match[1])
    } catch (error) {
      parseErrors.push(String(error).split('\n')[0])
      continue
    }
    for (const node of data['@graph'] || [data]) {
      if (node && node['@type'] === 'FAQPage') nodes.push(node)
    }
  }
  return { nodes, parseErrors }
}

// The questions and answers exactly as the crawler receives them.
export function faqEntries(html) {
  const { nodes, parseErrors } = faqNodes(html)
  const entries = []
  for (const node of nodes) {
    for (const entity of node.mainEntity || []) {
      entries.push({
        question: normaliseText(entity.name || ''),
        answer: normaliseText(entity.acceptedAnswer?.text || ''),
      })
    }
  }
  return { entries, nodes: nodes.length, parseErrors }
}

const MIN_ANSWER_CHARS = 60

// One page, against the questions it declares in src/seo.js or in an article's
// front matter. `declared` is optional: a page can carry a FAQPage without
// declaring one here (the home page does), and it is still checked for
// visibility — only the declared-vs-published comparison needs the list.
export function faqProblemsForPage({ label, html, declared = null }) {
  const problems = []
  const { entries, nodes, parseErrors } = faqEntries(html)
  for (const error of parseErrors) problems.push(`${label}: unparsable JSON-LD (${error})`)

  if (declared?.length && nodes === 0) {
    problems.push(`${label}: declares ${declared.length} FAQs but ships no FAQPage structured data`)
  }
  if (nodes > 1) problems.push(`${label}: ${nodes} FAQPage nodes; one page describes one FAQ`)

  const text = visibleText(html)
  const published = new Set()
  for (const entry of entries) {
    if (!entry.question) {
      problems.push(`${label}: an FAQPage question has no name`)
      continue
    }
    if (published.has(entry.question)) problems.push(`${label}: duplicate question "${entry.question}"`)
    published.add(entry.question)

    if (!text.includes(entry.question)) {
      problems.push(`${label}: FAQ question is not visible on the page — "${entry.question}"`)
    }
    if (entry.answer.length < MIN_ANSWER_CHARS) {
      problems.push(`${label}: FAQ answer is only ${entry.answer.length} chars — "${entry.question}"`)
    } else if (!text.includes(entry.answer)) {
      // The markup and the page disagree: either the answer was edited in one
      // place only, or it is written in markup the reader cannot see.
      problems.push(`${label}: FAQ answer is not visible verbatim — "${entry.question}"`)
    }
  }

  if (declared?.length) {
    for (const faq of declared) {
      const question = normaliseText(faq.question)
      if (!published.has(question)) {
        problems.push(`${label}: declared FAQ "${question}" is missing from the FAQPage structured data`)
      }
    }
    if (entries.length !== declared.length) {
      problems.push(`${label}: FAQPage carries ${entries.length} questions but ${declared.length} are declared`)
    }
  }

  return { problems, entries }
}

// Deliberately high. Two different pages asking "Where is Notion stronger?" and
// "Where is ShimoDocs stronger?" share most of their words and mean opposite
// things, so a low threshold produces warnings nobody reads.
const SIMILARITY_THRESHOLD = 0.7
const MIN_QUESTION_TOKENS = 3
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'can', 'we', 'our', 'you', 'your',
  'to', 'of', 'in', 'on', 'for', 'and', 'or', 'with', 'how', 'what', 'why', 'it',
  'its', 'be', 'i', 'there', 'that', 'this',
])

function tokens(question) {
  return new Set(
    question
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter(token => token && !STOP_WORDS.has(token)),
  )
}

function similarity(a, b) {
  const left = tokens(a)
  const right = tokens(b)
  if (left.size < MIN_QUESTION_TOKENS || right.size < MIN_QUESTION_TOKENS) return 0
  let shared = 0
  for (const token of left) if (right.has(token)) shared += 1
  return shared / (left.size + right.size - shared || 1)
}

// Every page of a build. `pages` is [{ label, html, declared? }]. Returns the
// per-page problems plus two site-wide findings: the same question published
// with two different answers is a failure, because an answer engine quoting
// either one makes the site contradict itself; a near-identical question on two
// pages is a warning, because the duplication may be deliberate.
export function auditFaqs(pages) {
  const problems = []
  const warnings = []
  const stats = { pages: pages.length, faqPages: 0, questions: 0 }
  const byQuestion = new Map()

  for (const page of pages) {
    const { problems: pageProblems, entries } = faqProblemsForPage(page)
    problems.push(...pageProblems)
    if (!entries.length) continue
    stats.faqPages += 1
    stats.questions += entries.length
    for (const entry of entries) {
      if (!byQuestion.has(entry.question)) byQuestion.set(entry.question, [])
      byQuestion.get(entry.question).push({ label: page.label, answer: entry.answer })
    }
  }

  const questions = [...byQuestion.keys()]
  for (const [question, uses] of byQuestion) {
    if (uses.length < 2) continue
    const answers = new Set(uses.map(use => use.answer))
    if (answers.size > 1) {
      problems.push(
        `the same question is published with ${answers.size} different answers: "${question}" ` +
          `(${uses.map(use => use.label).join(', ')})`,
      )
    }
  }
  for (let i = 0; i < questions.length; i += 1) {
    for (let j = i + 1; j < questions.length; j += 1) {
      const score = similarity(questions[i], questions[j])
      if (score < SIMILARITY_THRESHOLD || questions[i] === questions[j]) continue
      warnings.push(
        `near-duplicate FAQ questions (${score.toFixed(2)}): ` +
          `"${questions[i]}" (${byQuestion.get(questions[i])[0].label}) vs ` +
          `"${questions[j]}" (${byQuestion.get(questions[j])[0].label})`,
      )
    }
  }

  return { problems, warnings, stats }
}

// --------------------------------------------------------------- standalone

// Walks a built directory. `declaredByLabel` maps a route path to the questions
// that route declares in src/seo.js or in article front matter, which is what
// turns "the markup must describe visible content" into "the declared questions
// must all have been published". Without it the walk still checks every page
// that carries a FAQPage.
//
// The declarations are passed in rather than imported: this module stays free of
// src/ so it can be pointed at any built directory, including a live release.
export function auditFaqsInDirectory(distDir, declaredByLabel = new Map()) {
  const pages = readHtmlPages(distDir).map(page => ({
    ...page,
    declared: declaredByLabel.get(page.label) || null,
  }))
  return auditFaqs(pages)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const distDir = process.argv[2] || 'dist'
  const { problems, warnings, stats } = auditFaqsInDirectory(distDir)
  console.log(
    `FAQ check: ${stats.faqPages} of ${stats.pages} pages carry a FAQPage, ${stats.questions} questions.`,
  )
  for (const warning of warnings) console.log(`  warning: ${warning}`)
  if (problems.length) {
    console.error('FAQ check failed:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log('FAQ check passed: every question and answer in the markup is visible on its page.')
}

#!/usr/bin/env node
// The product definition and the numeric facts strip, checked against the
// pages that are supposed to carry them.
//
// Four surfaces have to print PRODUCT_DEFINITION character-for-character: the
// home hero, the about lead, Organization JSON-LD, and the llms.txt blockquote.
// The "What is ShimoDocs?" FAQ answer is the same string, so an assistant that
// quotes the FAQ cannot contradict the hero. The facts strip is the place the
// unit-bearing numbers live on the commercial pages.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PRODUCT_DEFINITION, PRODUCT_FACTS } from '../src/product-facts.js'
import { findNodes, jsonLdDocuments, readHtmlPages, visibleText } from './page-text.mjs'

const DEFINITION_PAGES = new Set(['/', '/about'])
const FACT_PAGES = new Set([
  '/',
  '/about',
  '/pricing',
  '/comparison',
  '/download',
  '/on-premises',
  '/airgap',
  '/security',
  '/migration',
  '/solutions/atlassian-alternative',
  '/solutions/confluence-alternative',
])

function factsBlock(html) {
  const match = html.match(/<section class="product-facts"[\s\S]*?<\/section>/)
  return match ? match[0] : ''
}

function organizationDescriptions(html) {
  const { documents, parseErrors } = jsonLdDocuments(html)
  const descriptions = []
  for (const document of documents) {
    for (const node of findNodes(document, 'Organization')) {
      if (typeof node.description === 'string') descriptions.push(node.description)
    }
  }
  return { descriptions, parseErrors }
}

function llmsDefinition(llms) {
  const lines = []
  let inQuote = false
  for (const line of llms.split('\n')) {
    if (line.startsWith('>')) {
      inQuote = true
      lines.push(line.replace(/^>\s?/, ''))
    } else if (inQuote) {
      break
    }
  }
  return lines.join(' ').replace(/\s+/g, ' ').trim()
}

export function auditProductFactsInDirectory(distDir) {
  const problems = []
  const pages = readHtmlPages(distDir)
  const byLabel = new Map(pages.map(page => [page.label, page]))
  let factStrips = 0

  for (const label of DEFINITION_PAGES) {
    const page = byLabel.get(label)
    if (!page) {
      problems.push(`${label}: page missing from the build`)
      continue
    }
    const text = visibleText(page.html)
    if (!text.includes(PRODUCT_DEFINITION)) {
      problems.push(`${label}: visible text no longer contains PRODUCT_DEFINITION`)
    }
    const { descriptions, parseErrors } = organizationDescriptions(page.html)
    for (const error of parseErrors) problems.push(`${label}: JSON-LD ${error}`)
    if (!descriptions.length) {
      problems.push(`${label}: Organization JSON-LD has no description`)
    }
    for (const description of descriptions) {
      if (description !== PRODUCT_DEFINITION) {
        problems.push(`${label}: Organization.description is not PRODUCT_DEFINITION`)
      }
    }
  }

  const home = byLabel.get('/')
  if (home) {
    const questions = []
    for (const document of jsonLdDocuments(home.html).documents) {
      questions.push(...findNodes(document, 'Question'))
    }
    const whatIs = questions.find(node => node.name === 'What is ShimoDocs?')
    if (!whatIs) {
      problems.push('home: FAQPage is missing "What is ShimoDocs?"')
    } else if (whatIs.acceptedAnswer?.text !== PRODUCT_DEFINITION) {
      problems.push('home: the "What is ShimoDocs?" FAQ answer is not PRODUCT_DEFINITION')
    }
  }

  const llmsPath = join(distDir, 'llms.txt')
  const llms = readFileSync(llmsPath, 'utf8')
  const quoted = llmsDefinition(llms)
  if (quoted !== PRODUCT_DEFINITION) {
    problems.push(`llms.txt blockquote is not PRODUCT_DEFINITION`)
  }

  const requiredFactPages = [
    ...FACT_PAGES,
    ...pages.map(page => page.label).filter(label => label.startsWith('/blog/shimodocs-vs-')),
  ]

  for (const label of requiredFactPages) {
    const page = byLabel.get(label)
    if (!page) {
      problems.push(`${label}: page missing from the build`)
      continue
    }
    const block = factsBlock(page.html)
    if (!block) {
      problems.push(`${label}: missing the product-facts strip`)
      continue
    }
    factStrips += 1
    const blockText = visibleText(block)
    for (const fact of PRODUCT_FACTS) {
      if (!blockText.includes(fact.value)) {
        problems.push(`${label}: product-facts strip is missing "${fact.value}"`)
      }
    }
  }

  return {
    problems,
    stats: {
      definitionPages: DEFINITION_PAGES.size,
      factStrips,
      factValues: PRODUCT_FACTS.length,
    },
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const distDir = process.argv[2] || 'dist'
  const { problems, stats } = auditProductFactsInDirectory(distDir)
  console.log(
    `Product facts: ${stats.definitionPages} definition pages, ${stats.factStrips} facts strips, ` +
      `${stats.factValues} unit-bearing values.`,
  )
  if (problems.length) {
    console.error('Product fact check failed:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log('Product fact check passed: definition and numeric facts agree.')
}

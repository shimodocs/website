#!/usr/bin/env node
// The commercial facts, checked against every page the build rendered.
//
// "Free for up to five people, $5 per user per month, 20% off annually" is now
// written once in src/pricing-facts.js and read from there by the footer, the
// pricing cards, the FAQ answers, the product structured data and the article
// CTAs. A large share of the articles also state the free limit in hand-written
// Markdown, which no import can reach.
//
// This check is what keeps those honest: it reads the rendered pages, finds the
// sentences that state each fact, and fails the build when one of them states a
// different number. Changing FREE_TEAM_LIMIT therefore updates every templated
// page and fails on every article that still says the old number, listing them —
// which is the point, because a price change that reaches half the site is worse
// than one that fails the build.
//
// Run on its own against a build or a live release:
//
//   node scripts/check-pricing-facts.mjs dist
import {
  ANNUAL_DISCOUNT_PERCENT,
  FREE_TEAM_LIMIT,
  FREE_TEAM_LIMIT_WORDS,
  TEAM_PRICE_CURRENCY,
  TEAM_PRICE_PER_USER,
} from '../src/pricing-facts.js'
import { pathToFileURL } from 'node:url'
import { findNodes, jsonLdDocuments, readHtmlPages, visibleText } from './page-text.mjs'

const TEAM_PRICE = String(TEAM_PRICE_PER_USER)
const FREE_PRICE = '0'

// One pattern per published language. The pattern captures the number so the
// check can compare it against the constant; adding a language to
// src/docs-languages.js means adding its phrasing here, the same way the deploy
// check repeats the language list on purpose.
const FREE_LIMIT_PATTERNS = [
  { language: 'en', pattern: /free for (?:teams? )?(?:of )?up to (\w+) (?:people|users|seats|members)/gi },
  { language: 'en', pattern: /teams? of (\w+) or fewer/gi },
  { language: 'en', pattern: /licence for (?:teams of )?(?:up to )?(\w+) (?:users|people)/gi },
  { language: 'de', pattern: /bis zu (\w+) Personen/gi },
  { language: 'ja', pattern: /(\d+) 名まで/gi },
]

const PER_USER_PRICE = /\$(\d+(?:\.\d+)?)\s*(?:\/|per)\s*(?:user|seat|member|person)/gi
const ANNUAL_DISCOUNT = /annual[^.]{0,60}?(\d+)%/gi

// The comparison page lists competitors' list prices next to ours, so the "every
// per-user price is ours" rule cannot apply there. Instead the page has to carry
// our row, rendered from the constant, and the numeric rule is skipped.
const COMPARISON_PAGE = '/comparison'

// The 404 document is a bare error page: no header, no footer, nothing to buy.
// It is the only page that does not carry the site chrome.
const CHROMELESS_PAGES = new Set(['/404.html'])

function allowedFreeLimits(language) {
  return new Set([String(FREE_TEAM_LIMIT), FREE_TEAM_LIMIT_WORDS[language] || String(FREE_TEAM_LIMIT)])
}

export function pricingFactProblems({ label, html }) {
  const problems = []
  const text = visibleText(html)

  // 1. The product structured data must quote the same price as the page.
  for (const document of jsonLdDocuments(html).documents) {
    for (const offer of findNodes(document, 'Offer')) {
      const price = String(offer.price)
      if (price !== FREE_PRICE && price !== TEAM_PRICE) {
        problems.push(
          `${label}: the ${offer.name || 'unnamed'} offer is priced ${price} ${offer.priceCurrency}, ` +
            `but the site sells at ${FREE_PRICE} and ${TEAM_PRICE}`,
        )
      }
      if (offer.priceCurrency !== TEAM_PRICE_CURRENCY) {
        problems.push(`${label}: the ${offer.name || 'unnamed'} offer is priced in ${offer.priceCurrency}`)
      }
    }
  }

  // 2. Prose that states how many people are free.
  for (const { language, pattern } of FREE_LIMIT_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const stated = match[1].toLowerCase()
      if (!allowedFreeLimits(language).has(stated)) {
        problems.push(
          `${label}: the free limit is stated as "${match[0].trim()}" (${language}), ` +
            `but FREE_TEAM_LIMIT is ${FREE_TEAM_LIMIT}`,
        )
      }
    }
  }

  // 3. Prose that states the per-user price.
  const prices = [...text.matchAll(PER_USER_PRICE)]
  if (label === COMPARISON_PAGE) {
    if (!text.includes(`$${TEAM_PRICE} / user / month`)) {
      problems.push(`${label}: the comparison table no longer carries our $${TEAM_PRICE} / user / month row`)
    }
  } else {
    for (const match of prices) {
      if (match[1] !== TEAM_PRICE) {
        problems.push(
          `${label}: states a per-user price of $${match[1]} ("${match[0].trim()}"), ` +
            `but TEAM_PRICE_PER_USER is ${TEAM_PRICE_PER_USER}`,
        )
      }
    }
  }

  // 4. Prose that states the annual discount.
  for (const match of text.matchAll(ANNUAL_DISCOUNT)) {
    if (match[1] !== String(ANNUAL_DISCOUNT_PERCENT)) {
      problems.push(
        `${label}: states an annual discount of ${match[1]}% ("${match[0].trim()}"), ` +
          `but ANNUAL_DISCOUNT_PERCENT is ${ANNUAL_DISCOUNT_PERCENT}`,
      )
    }
  }

  return problems
}

export function auditPricingFactsInDirectory(distDir) {
  const pages = readHtmlPages(distDir)
  const problems = []
  const claims = { freeLimit: 0, perUserPrice: 0, annualDiscount: 0 }
  let offers = { free: 0, team: 0 }

  for (const page of pages) {
    problems.push(...pricingFactProblems(page))
    const text = visibleText(page.html)
    for (const { pattern } of FREE_LIMIT_PATTERNS) claims.freeLimit += [...text.matchAll(pattern)].length
    claims.perUserPrice += [...text.matchAll(PER_USER_PRICE)].length
    claims.annualDiscount += [...text.matchAll(ANNUAL_DISCOUNT)].length

    // The footer states the licence terms on every page, including the article
    // layouts that no template reaches. A missing claim means the constant
    // reached the footer as nothing, which no other check here would notice.
    if (!CHROMELESS_PAGES.has(page.label) && !/free for up to \d+ users/i.test(text)) {
      problems.push(`${page.label}: the footer no longer states the free licence limit`)
    }

    for (const document of jsonLdDocuments(page.html).documents) {
      for (const offer of findNodes(document, 'Offer')) {
        if (String(offer.price) === FREE_PRICE) offers.free += 1
        if (String(offer.price) === TEAM_PRICE) offers.team += 1
      }
    }
  }

  // Both plans must be published: a pricing page whose Offer list lost the paid
  // plan still renders and still validates, and quietly stops describing the
  // product it sells.
  if (!offers.free) problems.push('no page publishes the free plan as an Offer')
  if (!offers.team) problems.push('no page publishes the paid plan as an Offer')

  return {
    problems,
    stats: {
      pages: pages.length,
      freeLimitClaims: claims.freeLimit,
      perUserPriceClaims: claims.perUserPrice,
      annualDiscountClaims: claims.annualDiscount,
      offers,
    },
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const distDir = process.argv[2] || 'dist'
  const { problems, stats } = auditPricingFactsInDirectory(distDir)
  console.log(
    `Pricing facts: ${stats.pages} pages, ${stats.freeLimitClaims} free-limit claims, ` +
      `${stats.perUserPriceClaims} per-user price claims, ${stats.annualDiscountClaims} annual-discount claims, ` +
      `${stats.offers.free} free and ${stats.offers.team} paid offers.`,
  )
  if (problems.length) {
    console.error('Pricing fact check failed:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log(
    `Pricing fact check passed: no page contradicts free=${FREE_TEAM_LIMIT} people, ` +
      `$${TEAM_PRICE_PER_USER}/user/month or ${ANNUAL_DISCOUNT_PERCENT}% annual.`,
  )
}

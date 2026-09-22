// The product definition and the handful of numeric facts a crawler should be
// able to quote. Same rule as src/pricing-facts.js: one source, and a build
// check that fails when a page that is supposed to carry them no longer does.
//
// The definition is the sentence the home hero, the about lead, the
// Organization JSON-LD, llms.txt and the "What is ShimoDocs?" FAQ all have to
// print identically. Rewording it in one of those places is how an answer
// engine starts describing the product as a platform in one sentence and a
// suite in the next.
import { DOWNLOADS } from './downloads.js'
import {
  ANNUAL_DISCOUNT_PERCENT,
  FREE_TEAM_LIMIT,
  TEAM_PRICE_PER_USER,
} from './pricing-facts.js'

export const PRODUCT_DEFINITION =
  'ShimoDocs is a self-hosted document collaboration suite for real-time docs, writers, spreadsheets, presentations, forms and tables, with configurable AI agents built into every product, deployed into a private cloud you control.'

// Visible <dl> rows. Values are the unit-bearing phrases the GEO extractor
// looks for ("5 users", "$5 per user per month", "20% off", "357 MB"). The
// numbers come from pricing-facts.js and downloads.js, so a price or installer
// change updates the strip and the check together.
export const PRODUCT_FACTS = [
  { term: 'Free plan', value: `${FREE_TEAM_LIMIT} users` },
  { term: 'Team plan', value: `$${TEAM_PRICE_PER_USER} per user per month` },
  { term: 'Annual billing', value: `${ANNUAL_DISCOUNT_PERCENT}% off` },
  { term: 'Linux installer (amd64)', value: DOWNLOADS.amd64.size },
  { term: 'Linux installer (arm64)', value: DOWNLOADS.arm64.size },
  { term: 'Deployment', value: 'single-node or high-availability Kubernetes' },
]

export function articleShowsProductFacts(slug) {
  return String(slug).startsWith('shimodocs-vs-')
}

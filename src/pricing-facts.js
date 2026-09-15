// The commercial facts this site states over and over.
//
// "Free for teams of up to five people, $5 per user per month, 20% off when
// billed annually" is written in the footer of every page, in the pricing cards,
// in the FAQ answers, in the product structured data and in the closing
// paragraph of a large share of the articles. Each of those was an independent
// string, which made a price change a grep-and-hope exercise: miss one and the
// site contradicts itself in public, in the middle of a sales conversation.
//
// The numbers live here once. The prose that states them reads from this module,
// and scripts/check-pricing-facts.mjs fails the build for a rendered page that
// still states a different number — including the pages whose copy is
// hand-written Markdown and cannot be templated.
export const FREE_TEAM_LIMIT = 5
// The same number written out, per language.
//
// Keyed by the limit it belongs to rather than sitting in a flat table beside
// the number: with two independent values, changing one and forgetting the other
// was a silent half-change that only surfaced later, on the pages. Keyed, the
// lookup below fails at import time instead — before anything is rendered — and
// names the row that has to be added. So there is one fact to change and no way
// to change it halfway.
const FREE_TEAM_LIMIT_WORDS_BY_LIMIT = {
  5: { en: 'five', de: 'fünf', es: 'cinco', fr: 'cinq', ja: '5', ko: '5', th: '5', vi: 'năm' },
}

export const FREE_TEAM_LIMIT_WORDS = FREE_TEAM_LIMIT_WORDS_BY_LIMIT[FREE_TEAM_LIMIT]
if (!FREE_TEAM_LIMIT_WORDS) {
  throw new Error(
    `No word forms for a free-team limit of ${FREE_TEAM_LIMIT}. Add a "${FREE_TEAM_LIMIT}" row to ` +
      'FREE_TEAM_LIMIT_WORDS_BY_LIMIT in src/pricing-facts.js, one entry per language in LANGUAGE_META.',
  )
}
export const FREE_TEAM_LIMIT_WORD = FREE_TEAM_LIMIT_WORDS.en
export const TEAM_PRICE_PER_USER = 5
export const TEAM_PRICE_CURRENCY = 'USD'
export const ANNUAL_DISCOUNT_PERCENT = 20

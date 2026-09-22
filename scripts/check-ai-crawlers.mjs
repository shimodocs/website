#!/usr/bin/env node
// Edge access for the crawlers that actually cite, plus the training crawlers
// we have decided to let read the public site.
//
// Origin nginx does not discriminate by User-Agent (curl the origin IP on
// port 80 to prove it). A 403 here is Cloudflare Bot Fight / AI Crawl Control.
// This script talks to the public hostname on purpose: a build that fetches
// origin would report a green result while GPTBot and ClaudeBot still see
// "Your request was blocked."
//
// Not part of `npm run build`. Run against production:
//
//   node scripts/check-ai-crawlers.mjs
const SITE = (process.env.SITE_URL || 'https://shimodocs.com').replace(/\/+$/, '')

const PATHS = ['/', '/sitemap.xml', '/llms.txt', '/blog/shimodocs-vs-confluence']

const AGENTS = [
  {
    name: 'GPTBot',
    allow: true,
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
  },
  {
    name: 'ClaudeBot',
    allow: true,
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  },
  {
    name: 'Amazonbot',
    allow: true,
    ua: 'Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)',
  },
  {
    name: 'ChatGPT-User',
    allow: true,
    ua: 'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)',
  },
  {
    name: 'OAI-SearchBot',
    allow: true,
    ua: 'OAI-SearchBot/1.0; +https://openai.com/searchbot',
  },
  {
    name: 'PerplexityBot',
    allow: true,
    ua: 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://docs.perplexity.ai/guides/bots)',
  },
  {
    name: 'Bytespider',
    allow: false,
    ua: 'Mozilla/5.0 (compatible; Bytespider; https://zhanzhang.toutiao.com/)',
  },
]

async function probe(ua, path) {
  const response = await fetch(`${SITE}${path}`, {
    method: 'GET',
    redirect: 'manual',
    headers: { 'user-agent': ua },
    signal: AbortSignal.timeout(20000),
  })
  return { status: response.status, bytes: Number(response.headers.get('content-length')) || 0 }
}

const rows = []
for (const agent of AGENTS) {
  for (const path of PATHS) {
    try {
      const { status, bytes } = await probe(agent.ua, path)
      rows.push({ agent: agent.name, allow: agent.allow, path, status, bytes })
    } catch (error) {
      rows.push({
        agent: agent.name,
        allow: agent.allow,
        path,
        status: 0,
        bytes: 0,
        error: error.message,
      })
    }
  }
}

const problems = []
for (const row of rows) {
  const ok = row.status === 200
  if (row.allow && !ok) {
    problems.push(`${row.agent} ${row.path}: HTTP ${row.status || row.error} (expected 200)`)
  }
  if (!row.allow && ok) {
    problems.push(`${row.agent} ${row.path}: HTTP 200 (Bytespider should stay blocked)`)
  }
  const mark = row.allow ? (ok ? 'allow' : 'FAIL') : ok ? 'WARN' : 'block'
  console.log(`${mark.padEnd(5)} ${row.agent.padEnd(16)} ${String(row.status).padEnd(4)} ${row.path}`)
}

if (problems.length) {
  console.error('\nAI crawler check failed:')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error(
    '\nCloudflare dashboard (zone shimodocs.com, Free plan): Security → Bots → Bot Fight Mode / AI Crawl Control.',
  )
  console.error('Allow GPTBot, ClaudeBot, Amazonbot. Keep Bytespider blocked. robots.txt is not the lever.')
  process.exit(1)
}

console.log(`\nAI crawler check passed against ${SITE}.`)

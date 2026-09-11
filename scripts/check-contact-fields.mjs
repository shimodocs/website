#!/usr/bin/env node
// Guards the Teable contact-form mapping.
//
// The page submits by field id, so renaming a column in Teable is safe — but
// moving the *meaning* between columns is not: if the columns are shuffled, an
// id that used to hold a name can start holding an email, and every inquiry
// would be written into the wrong column with no error anywhere.
//
// This reads the ids and the expected column names out of src/contact.js, asks
// the public share view what those ids are called now, and fails on a mismatch.
//
// Policy: a mismatch fails the release, because it corrupts data. An
// unreachable endpoint only warns, because a Teable outage must not block an
// unrelated release.
await fetchApi()

function fail(problems) {
  console.error('Contact form mapping check failed:')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('Fix FIELD_IDS in src/contact.js to match the shared form view, then retry.')
  process.exit(1)
}

async function fetchApi() {
  const { readFileSync } = await import('node:fs')
  const { join, dirname, resolve } = await import('node:path')
  const { fileURLToPath } = await import('node:url')

  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const source = readFileSync(join(rootDir, 'src', 'contact.js'), 'utf8')

  const endpointMatch = source.match(/https:\/\/app\.teable\.ai\/api\/share\/[A-Za-z0-9]+\/view\/form-submit/)
  if (!endpointMatch) {
    fail(['src/contact.js no longer contains a Teable share form endpoint'])
  }

  function parseObject(name) {
    const body = source.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\}`))
    if (!body) fail([`src/contact.js no longer declares ${name}`])
    const entries = {}
    for (const match of body[1].matchAll(/(\w+):\s*'([^']*)'/g)) entries[match[1]] = match[2]
    return entries
  }

  const ids = parseObject('FIELD_IDS')
  const names = parseObject('FIELD_NAMES')

  const problems = []
  const seen = new Map()
  for (const [key, id] of Object.entries(ids)) {
    if (!names[key]) problems.push(`${key}: no expected column name in FIELD_NAMES`)
    if (seen.has(id)) problems.push(`${key}: shares field id ${id} with ${seen.get(id)}`)
    seen.set(id, key)
  }
  for (const key of Object.keys(names)) {
    if (!ids[key]) problems.push(`${key}: listed in FIELD_NAMES but missing from FIELD_IDS`)
  }
  if (problems.length) fail(problems)

  const metaUrl = endpointMatch[0].replace(/\/view\/form-submit$/, '/view')
  let meta
  try {
    const response = await fetch(metaUrl, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    meta = await response.json()
  } catch (error) {
    console.warn(
      `Contact form mapping not verified: ${metaUrl} is unreachable (${error.message}). ` +
        'Continuing, because an outage must not block an unrelated release.',
    )
    return
  }

  if (meta.view?.type !== 'form') {
    problems.push(`the shared view is "${meta.view?.type}", not a form view`)
  }

  const byId = new Map((meta.fields ?? []).map(field => [field.id, field]))
  for (const [key, id] of Object.entries(ids)) {
    const field = byId.get(id)
    if (!field) {
      problems.push(`${key}: field id ${id} is not in the shared form any more`)
    } else if (field.name !== names[key]) {
      problems.push(`${key}: id ${id} is now the column "${field.name}", expected "${names[key]}"`)
    }
  }

  if (problems.length) fail(problems)
  console.log(
    `Contact form mapping verified: ${Object.keys(ids).length} field ids still match ` +
      `their Teable columns (${Object.values(names).join(', ')}).`,
  )
}

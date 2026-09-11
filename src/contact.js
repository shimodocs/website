// Contact-sales form submission.
//
// The form posts to Teable's public share-form endpoint. That endpoint needs no
// credential and answers with `access-control-allow-origin: *`, so a static page
// can call it directly: no backend, no proxy, no secret in the bundle. The
// share link is public by design — anyone holding it can submit a row, exactly
// like opening the form in a browser — so the only abuse controls are the
// honeypot field in the form and Teable's own rate limiting.
//
// Rotating the link: replace the shared form in Teable (Share form → copy the
// new link), then update CONTACT_ENDPOINT below, or build with
// VITE_CONTACT_ENDPOINT to override it without touching the code.

export const CONTACT_ENDPOINT =
  import.meta.env.VITE_CONTACT_ENDPOINT ||
  'https://app.teable.ai/api/share/shr3o8M2RVcBeSz4KCV/view/form-submit'

// Teable addresses each column by field id, so renaming a column in the table
// cannot silently break the form. These ids belong to the shared form view
// "官网联系表单"; `GET https://app.teable.ai/api/share/<shareId>/view` lists
// them next to the field names and types. `npm run check:contact` verifies that
// every id below still carries the column named in the comment — if the columns
// in Teable are shuffled or renamed, that check fails the release instead of
// quietly writing a name into the email column.
const FIELD_IDS = {
  email: 'fldh3njWoBjMxgBtxHD', // 工作邮箱 (primary field)
  name: 'fldF2EPy8psae3sJcPa', // 姓名
  teamSize: 'fld5h0Y4WhyAy47DOo3', // 团队规模
  message: 'fldQa4NIZtbzbvibX2C', // 需求描述
}

// The column each id is expected to be, checked by scripts/check-contact-fields.mjs.
export const FIELD_NAMES = {
  email: '工作邮箱',
  name: '姓名',
  teamSize: '团队规模',
  message: '需求描述',
}

// The public channel documented in the repository README, used as the fallback
// when the form itself cannot deliver.
export const CONTACT_FALLBACK_EMAIL = 'support.global@shimo.im'

const TIMEOUT_MS = 15000

/**
 * Send one inquiry to the shared Teable form.
 *
 * Resolves when the endpoint answered 2xx (Teable replies 201 with the created
 * record) and rejects otherwise, so the caller can choose between the success
 * and the error state without inspecting the response body.
 *
 * @param {{ name: string, email: string, teamSize: string, message: string }} inquiry
 */
export async function submitInquiry(inquiry, { timeoutMs = TIMEOUT_MS } = {}) {
  const fields = {}
  for (const [key, fieldId] of Object.entries(FIELD_IDS)) {
    const value = typeof inquiry[key] === 'string' ? inquiry[key].trim() : inquiry[key]
    if (value) fields[fieldId] = value
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // typecast lets Teable coerce the strings a form always sends into the
      // column types — the team-size single select — instead of rejecting them.
      body: JSON.stringify({ fields, typecast: true }),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`Contact endpoint answered ${response.status}`)
    }
  } finally {
    clearTimeout(timer)
  }
}

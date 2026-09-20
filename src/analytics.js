const EVENT_ENDPOINT = '/__analytics/event'
const FIRST_TOUCH_KEY = 'shimodocs:first-touch'
const EVENTS = new Set(['download_click', 'license_request_click', 'contact_sales_submit'])

function parseReferrer(value) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return { host: '', path: '' }
    return { host: url.hostname.toLowerCase().slice(0, 120), path: url.pathname.slice(0, 500) }
  } catch {
    return { host: '', path: '' }
  }
}

function rememberFirstTouch() {
  const first = parseReferrer(document.referrer)
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(FIRST_TOUCH_KEY))
    if (saved && typeof saved.host === 'string' && typeof saved.path === 'string') {
      if (!saved.host && !saved.path) return { host: '', path: '' }
      if (/^[a-z0-9.-]+$/i.test(saved.host) && saved.path.startsWith('/') && !saved.path.startsWith('//')) {
        return parseReferrer(`https://${saved.host}${saved.path}`)
      }
    }
  } catch {
    // Storage can be disabled, malformed, or from an older implementation.
  }
  try {
    window.sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(first))
  } catch { /* Recording an event does not require storage. */ }
  // An internal referrer can mean a static article was the landing page. Keep
  // it internal: without a bundle there we do not know its external first touch.
  return first
}

export function trackEvent(event, details = {}) {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !EVENTS.has(event)) return
    const firstTouch = rememberFirstTouch()
    const params = new URLSearchParams({
      event,
      page: window.location.pathname.slice(0, 300),
      entry_host: firstTouch.host,
      entry_path: firstTouch.path,
    })
    for (const key of ['arch', 'surface', 'release']) {
      const value = details?.[key]
      if (typeof value === 'string' && value) params.set(key, value.slice(0, 200))
    }
    const url = `${EVENT_ENDPOINT}?${params}`
    const body = new Blob([], { type: 'text/plain' })
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url, body)) return
    void fetch(url, { method: 'POST', body: '', keepalive: true, credentials: 'omit' }).catch(() => {})
  } catch {
    // Analytics must never block navigation or the user action that triggered it.
  }
}

export function installAnalytics() {
  if (typeof document === 'undefined') return () => {}
  try { rememberFirstTouch() } catch { /* Tracking is best effort. */ }
  const onClick = event => {
    const target = event.target instanceof Element ? event.target.closest('a[data-analytics-event]') : null
    if (!target) return
    trackEvent(target.dataset.analyticsEvent, {
      arch: target.dataset.downloadArch,
      surface: target.dataset.analyticsSurface,
      release: target.dataset.downloadRelease,
    })
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}

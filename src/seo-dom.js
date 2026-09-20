// Client-side head synchronisation.
//
// Prerendering writes the correct tags into each HTML file, but a visitor who
// navigates with the in-app nav never triggers a document load. This keeps the
// title, description, canonical and structured data aligned with the route the
// person is actually looking at.
import { SITE_NAME, OG_IMAGE_URL, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, jsonLdFor, resolveSeo } from './seo'

const MANAGED = 'data-seo-managed'

function upsertMeta(attribute, key, content) {
  if (content == null) return
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute(attribute, key)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
  node.setAttribute(MANAGED, '')
}

function upsertLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`)
  if (!node) {
    node = document.createElement('link')
    node.setAttribute('rel', rel)
    document.head.appendChild(node)
  }
  node.setAttribute('href', href)
  node.setAttribute(MANAGED, '')
}

function upsertStructuredData(payload) {
  let node = document.getElementById('structured-data')
  if (!node) {
    node = document.createElement('script')
    node.type = 'application/ld+json'
    node.id = 'structured-data'
    document.head.appendChild(node)
  }
  node.textContent = JSON.stringify(payload)
  node.setAttribute(MANAGED, '')
}

export function applySeo(pathname) {
  const meta = resolveSeo(pathname)

  document.title = meta.title
  document.documentElement.setAttribute('lang', 'en')

  upsertMeta('name', 'description', meta.description)
  upsertMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')

  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:locale', 'en_US')
  upsertMeta('property', 'og:title', meta.title)
  upsertMeta('property', 'og:description', meta.description)
  upsertMeta('property', 'og:url', meta.canonical)
  upsertMeta('property', 'og:image', OG_IMAGE_URL)
  upsertMeta('property', 'og:image:width', String(OG_IMAGE_WIDTH))
  upsertMeta('property', 'og:image:height', String(OG_IMAGE_HEIGHT))
  upsertMeta('property', 'og:image:alt', meta.ogAlt)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', meta.title)
  upsertMeta('name', 'twitter:description', meta.description)
  upsertMeta('name', 'twitter:image', OG_IMAGE_URL)
  upsertMeta('name', 'twitter:image:alt', meta.ogAlt)

  upsertLink('canonical', meta.canonical)
  upsertStructuredData(jsonLdFor(meta.path))
}

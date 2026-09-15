// The language row shown on every translated guide and on every translated
// documentation index.
//
// It is the visible half of the hreflang set in the page head: the head tells
// Google which pages are translations of each other, and this tells a reader
// who landed on the wrong one how to switch. Languages are rendered in their
// own script — "日本語", not "Japanese" — because a reader looking for their
// language scans for their own alphabet.
import { DOCS_DEFAULT_LANGUAGE, LANGUAGE_META, docsUi } from '../docs-languages'

export default function DocsLanguageRow({ language = DOCS_DEFAULT_LANGUAGE, alternates = [] }) {
  // x-default is a routing hint for search engines, not something to click.
  const other = alternates.filter(alternate => alternate.hreflang !== 'x-default')
  if (other.length < 2) return null
  const ui = docsUi(language)

  return (
    <nav className="doc-languages" aria-label={ui.languageLabel}>
      <span>{ui.languageLabel}</span>
      {other.map(alternate => (
        <a
          key={alternate.hreflang}
          href={alternate.href}
          hrefLang={alternate.hreflang}
          className={alternate.hreflang === language ? 'active' : undefined}
          aria-current={alternate.hreflang === language ? 'true' : undefined}
        >
          {(LANGUAGE_META[alternate.hreflang] || {}).label || alternate.hreflang}
        </a>
      ))}
    </nav>
  )
}

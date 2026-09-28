import { formatDate } from '../format'

export function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>
}

export function Button({ to, children, secondary = false }) {
  return <a className={secondary ? 'button secondary' : 'button'} href={to}>{children}</a>
}

// Route pages have a real content date in src/seo.js. Rendering it in the
// page body makes the date useful to people and keeps dateModified structured
// data grounded in visible copy instead of leaving it as a crawler-only claim.
export function PageUpdated({ date, label = 'Last updated' }) {
  if (!date) return null
  return (
    <p className="page-updated">
      {label} <time dateTime={date}>{formatDate(date)}</time>
    </p>
  )
}

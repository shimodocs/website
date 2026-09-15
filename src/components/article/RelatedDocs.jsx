// The guides an article points at.
//
// Rendered outside the article layout so all four layouts get it without
// carrying the mapping themselves, and static like the rest of the article:
// nothing here hydrates.
export default function RelatedDocs({ links = [] }) {
  if (!links.length) return null
  return (
    <aside className="post-docs">
      <b>From the documentation</b>
      <ul>
        {links.map(doc => (
          <li key={doc.url}>
            <a href={doc.url}>{doc.title}</a>
            <small>{doc.description}</small>
          </li>
        ))}
      </ul>
    </aside>
  )
}

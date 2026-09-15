// Commercial hub page.
//
// One component renders every entry in src/hubs.js, keyed by the current path,
// so adding a hub is a data entry plus a route rather than a new layout.
//
// The visible FAQ is read from the same ROUTE_SEO entry that produces the
// FAQPage structured data, so the written answer and the marked-up answer are
// the same string by construction.
import { useLocation } from 'react-router-dom'
import { Eyebrow } from '../components/Section'
import { HUBS } from '../hubs'
import { ROUTE_SEO, normalisePath } from '../seo'
import { DOWNLOADS, LICENSE_REQUEST_URL } from '../downloads'

function HubLinks({ links }) {
  if (!links?.length) return null
  return (
    <ul className="hub-links">
      {links.map(([href, label]) => (
        <li key={href}>
          {/* Guides and articles are standalone static documents, so these are
              real anchors rather than router Links. */}
          <a href={href}>{label}</a>
        </li>
      ))}
    </ul>
  )
}

// A section can carry one table. Anything wider than the column scrolls rather
// than widening the page, which matters for the tier matrices.
function HubTable({ table }) {
  if (!table) return null
  return (
    <figure className="hub-table">
      <div className="hub-table-scroll">
        <table>
          <thead>
            <tr>
              {table.head.map(cell => (
                <th key={cell} scope="col">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map(row => (
              <tr key={row[0]}>
                {row.map((cell, index) =>
                  index === 0 ? (
                    <th key={cell} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={`${row[0]}-${index}`}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.caption ? <figcaption>{table.caption}</figcaption> : null}
    </figure>
  )
}

export default function Hub() {
  const { pathname } = useLocation()
  const path = normalisePath(pathname)
  const hub = HUBS[path]
  const faqs = ROUTE_SEO[path]?.faqs || []

  if (!hub) return null

  return (
    <div className="page hub-page">
      <section className="hub-hero">
        <Eyebrow>{hub.eyebrow}</Eyebrow>
        <h1>
          {hub.h1[0]}
          <br />
          <span className="gradient">{hub.h1[1]}</span>
        </h1>
        <p>{hub.lead}</p>
        <div className="hub-actions">
          <a className="button" href={DOWNLOADS.amd64.url}>
            Download for Linux · amd64
          </a>
          <a className="button outline" href={LICENSE_REQUEST_URL}>
            Get a free perpetual license
          </a>
          <a className="text-link" href="/docs">
            Read the deployment guides ↗
          </a>
        </div>
      </section>

      {hub.sections.map(section => (
        <section className="hub-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body.map(paragraph => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
          {section.list ? (
            <ul className="hub-list">
              {section.list.map(item => (
                <li key={item.slice(0, 40)}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.note ? <p className="hub-note">{section.note}</p> : null}
          <HubTable table={section.table} />
          <HubLinks links={section.links} />
        </section>
      ))}

      {hub.checklist ? (
        <section className="hub-checklist">
          <h2>{hub.checklist.heading}</h2>
          <ul>
            {hub.checklist.items.map(item => (
              <li key={item.slice(0, 40)}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {faqs.length ? (
        <section className="hub-faq" id="faq">
          <h2>Frequently asked questions</h2>
          {faqs.map(faq => (
            <article key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </section>
      ) : null}

      <aside className="hub-cta">
        <div>
          <p className="hub-cta-kicker">Free for teams of up to five people</p>
          <h2>Bring the deployment questions to us</h2>
          <p>
            Send us your topology and middleware decisions and we will tell you what the deployment looks like — or
            start with the installer and find out yourself.
          </p>
        </div>
        <div className="hub-cta-actions">
          <a className="button" href="/contact-sales">
            Request a private cloud demo
          </a>
          <a className="button outline" href="/docs">
            Open the documentation
          </a>
        </div>
      </aside>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Section'
import { ROUTE_SEO } from '../seo'

// The questions live in src/seo.js next to the page metadata, so the FAQ a
// reader sees and the FAQPage markup are the same strings by construction. The
// build fails if a declared question is not rendered here, which is what keeps
// the visible page and the structured data from drifting apart.
const FAQS = ROUTE_SEO['/pricing'].faqs || []

export default function Pricing() {
  return (
    <div className="page">
      <section className="section page-intro">
        <Eyebrow>Pricing</Eyebrow>
        <h1>
          Start small.
          <br />
          <span className="gradient">Scale with clarity.</span>
        </h1>
        <p>One straightforward plan for teams that want docs, data and AI in one connected workspace.</p>
      </section>

      <section className="section pricing-grid">
        <article>
          <span className="plan-label">UP TO 5 PEOPLE</span>
          <h2>Free</h2>
          <p>A complete workspace for small teams getting started.</p>
          <strong>
            $0 <small>forever</small>
          </strong>
          <ul>
            <li>✓ Documents, tables and presentations</li>
            <li>✓ Shared workspace and comments</li>
            <li>✓ AI workspace preview</li>
            <li>✓ Version history</li>
          </ul>
          <Link to="/contact-sales" className="text-link">
            Get started ↗
          </Link>
        </article>
        <article className="featured">
          <span className="plan-label">5+ PEOPLE</span>
          <h2>Team</h2>
          <p>Flexible access for growing teams and shared work.</p>
          <strong>
            $5 <small>/ user / month</small>
          </strong>
          <ul>
            <li>✓ Everything in Free</li>
            <li>✓ Unlimited team members</li>
            <li>✓ Advanced permissions and admin controls</li>
            <li>✓ AI assistance across your workspace</li>
          </ul>
          <Link to="/contact-sales" className="button">
            Talk to sales
          </Link>
        </article>
      </section>

      <p className="pricing-note">
        <b>Simple rule:</b> teams with five or fewer people are free. Teams above five pay for each user. Annual billing
        saves 20%. Private cloud infrastructure is quoted separately.
      </p>

      <section className="hub-faq" id="faq">
        <h2>Pricing and licensing questions</h2>
        {FAQS.map(faq => (
          <article key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

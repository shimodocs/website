import { Link } from 'react-router-dom'
import { ProductFacts } from '../components/ProductFacts'
import { Eyebrow, PageUpdated } from '../components/Section'
import { ROUTE_SEO, ROUTE_UPDATED } from '../seo'
import { ANNUAL_DISCOUNT_PERCENT, FREE_TEAM_LIMIT, FREE_TEAM_LIMIT_WORD, TEAM_PRICE_PER_USER } from '../pricing-facts.js'

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
        <PageUpdated date={ROUTE_UPDATED['/pricing']} />
      </section>

      <section className="section">
        <ProductFacts />
      </section>

      <section className="section pricing-grid">
        <article>
          <span className="plan-label">UP TO {FREE_TEAM_LIMIT} PEOPLE</span>
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
          <Link to="/download" className="text-link">
            Download ↗
          </Link>
        </article>
        <article className="featured">
          <span className="plan-label">MORE THAN {FREE_TEAM_LIMIT} PEOPLE</span>
          <h2>Team</h2>
          <p>Flexible access for growing teams and shared work.</p>
          <strong>
            ${TEAM_PRICE_PER_USER} <small>/ user / month</small>
          </strong>
          <ul>
            <li>✓ Everything in Free</li>
            <li>✓ Unlimited team members</li>
            <li>✓ Advanced permissions and admin controls</li>
            <li>✓ AI assistance across your workspace</li>
          </ul>
          <Link to="/contact-sales" className="button">
            Contact sales
          </Link>
        </article>
      </section>

      <p className="pricing-note">
        <b>Simple rule:</b> teams with {FREE_TEAM_LIMIT_WORD} or fewer people are free. Teams above{' '}
        {FREE_TEAM_LIMIT_WORD} pay for each user. Annual billing
        saves {ANNUAL_DISCOUNT_PERCENT}%. Private cloud infrastructure is quoted separately.
      </p>

      <section className="hub-section post-body">
        <h2>Plan for the workspace and its deployment</h2>
        <p>
          The per-user price is the ShimoDocs software licence. Servers, storage and networking
          are outside that price; private cloud infrastructure provided for you is quoted separately.
          Use the <a href="/docs/deployment">deployment documentation</a> to scope the environment
          your team will operate.
        </p>
        <p>
          AI features connect to model, search and embedding services you configure. Budget for
          those services according to your provider or hosting arrangement, and confirm their
          charges separately when planning your deployment. The{' '}
          <a href="/docs/deployment/operations-platform/suite/ai-configuration">AI configuration reference</a>{' '}
          explains which connections each capability requires.
        </p>
        <h3>Choose a plan and get started</h3>
        <ol>
          <li>
            Count your team members: up to {FREE_TEAM_LIMIT_WORD} people use Free; above that
            limit, Team is charged for every user, not just the additional seats.
          </li>
          <li>
            Review deployment requirements with your administrator and decide which AI services,
            if any, you need to connect.
          </li>
          <li>
            <a href="/contact-sales">Contact sales</a> with your team size and deployment needs
            to request the appropriate licence.
          </li>
          <li>
            After deployment, activate the licence in the operations platform. Follow the{' '}
            <a href="/docs/deployment/operations-platform/suite/license-management">licence management steps</a>{' '}
            to check the verification results before publishing it.
          </li>
        </ol>
      </section>

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

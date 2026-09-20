import { useState } from 'react'
import { Eyebrow } from '../components/Section'
import { CONTACT_FALLBACK_EMAIL, submitInquiry } from '../contact'
import { trackEvent } from '../analytics'

const TEAM_SIZES = ['5–20 people', '21–100 people', '100+ people']
// Deliberately loose: the server is the only place that can reject an address
// properly, so the browser only catches what a typo looks like.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const EMPTY_FORM = { name: '', email: '', teamSize: TEAM_SIZES[0], message: '', company: '' }

export default function ContactSales() {
  const [values, setValues] = useState(EMPTY_FORM)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const change = key => event => {
    const { value } = event.target
    setValues(current => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (status === 'sending') return // a double click must not create two rows

    const name = values.name.trim()
    const email = values.email.trim()
    const message = values.message.trim()

    // Only the work email is required: it is the one field we cannot reply
    // without. An empty name is simply left out of the submission, which is why
    // the 姓名 column must stay optional in Teable (see deploy/README.md).
    if (!EMAIL_PATTERN.test(email)) {
      setError('Please check the email address — we reply to every inquiry by email.')
      return
    }
    setError('')

    // Honeypot. A visitor never sees this field; a script that fills every
    // input gets a success page and no row. It only stops naive form bots —
    // nothing client-side can stop a script that posts to the endpoint itself.
    if (values.company) {
      setStatus('sent')
      return
    }

    setStatus('sending')
    trackEvent('contact_sales_submit', { surface: 'contact_sales_form' })
    try {
      await submitInquiry({
        name,
        email,
        teamSize: values.teamSize,
        message,
      })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  function reset() {
    setValues(EMPTY_FORM)
    setError('')
    setStatus('idle')
  }

  return (
    <div className="page">
      <section className="section contact-grid">
        <div>
          <Eyebrow>Contact Sales</Eyebrow>
          <h1>Bring your<br /><span className="gradient">real workflow.</span></h1>
          <p>Tell us what your team is building, and we’ll map the right ShimoDocs setup for your people, files and AI habits.</p>
          <div className="contact-points">
            <span><b>01</b> Workspace design</span>
            <span><b>02</b> AI rollout</span>
            <span><b>03</b> Private deployment</span>
          </div>
        </div>

        {status === 'sent' ? (
          <div className="contact-form contact-sent" role="status">
            <Eyebrow>Let’s talk</Eyebrow>
            <h2>Thanks — that reached us.</h2>
            <p>
              A ShimoDocs specialist will reply to your work email within one business day with the next
              step for your team.
            </p>
            <p className="contact-sent-note">
              Need to add something? Reply to our email or write to{' '}
              <a href={`mailto:${CONTACT_FALLBACK_EMAIL}`}>{CONTACT_FALLBACK_EMAIL}</a>.
            </p>
            <button className="button" type="button" onClick={reset}>Send another inquiry</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <Eyebrow>Let’s talk</Eyebrow>

            <label htmlFor="contact-name">
              Name (optional)
              <input
                id="contact-name"
                name="name"
                value={values.name}
                onChange={change('name')}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>

            <label htmlFor="contact-email">
              Work email
              <input
                id="contact-email"
                name="email"
                type="email"
                value={values.email}
                onChange={change('email')}
                autoComplete="email"
                placeholder="you@company.com"
                required
              />
            </label>

            <label htmlFor="contact-team-size">
              Team size
              <select
                id="contact-team-size"
                name="teamSize"
                value={values.teamSize}
                onChange={change('teamSize')}
              >
                {TEAM_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>

            <label htmlFor="contact-message">
              What are you working on?
              <textarea
                id="contact-message"
                name="message"
                value={values.message}
                onChange={change('message')}
                placeholder="A sentence or two is enough."
              />
            </label>

            {/* Honeypot: hidden from people, tempting to bots. */}
            <label className="contact-honeypot" aria-hidden="true">
              Company website
              <input
                name="company"
                value={values.company}
                onChange={change('company')}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>

            {error ? <p className="contact-error" role="alert">{error}</p> : null}

            {status === 'error' ? (
              <p className="contact-error" role="alert">
                We couldn’t send that just now. Please try again, or email{' '}
                <a href={`mailto:${CONTACT_FALLBACK_EMAIL}`}>{CONTACT_FALLBACK_EMAIL}</a> directly.
              </p>
            ) : null}

            <button className="button" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send inquiry ↗'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

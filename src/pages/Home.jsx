import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Section'
import { DOWNLOADS, LICENSE_REQUEST_URL } from '../downloads'
import { ProductFacts } from '../components/ProductFacts'
import { PRODUCT_DEFINITION } from '../product-facts.js'
import { FAQS } from '../seo'

const words = ['Docs', 'Teams', 'AI']

const caps = [
  ['Documents', 'Real-time collaborative documents where teams write, comment and resolve feedback together', 'extract-1.webp'],
  ['Writers', 'Polished word processing for every shared draft, contract and specification', 'extract-2.webp'],
  ['Spreadsheets', 'Flexible spreadsheets for shared data, modelling and operational decisions', 'extract-3.webp'],
  ['Presentations', 'Collaborative slides that keep the story moving from draft to review', 'extract-4.webp'],
  ['App sheets', 'Apps and tables that keep projects, owners and deadlines on track', 'extract-5.webp'],
  ['Forms', 'Forms that turn field responses into structured, usable context', 'extract-6.webp'],
]

// Intrinsic dimensions. The CSS sizes both frames explicitly, so these do not
// change the layout — they let the browser reserve the box before the image
// arrives, which is the part of Core Web Vitals the home page was failing.
const imageSizes = {
  'extract-1.webp': [1672, 941],
  'extract-2.webp': [1714, 918],
  'extract-3.webp': [1600, 900],
  'extract-4.webp': [1672, 941],
  'extract-5.webp': [1619, 971],
  'extract-6.webp': [1717, 916],
  'extract-7.webp': [1672, 941],
}

const scenes = [
  ['Knowledge management', 'Build a team knowledge hub.', 'extract-2.webp'],
  ['Project management', 'Plan a project launch.', 'extract-3.webp'],
  ['Meeting notes', 'Capture meeting decisions.', 'extract-6.webp'],
  ['Policy & SOPs', 'Keep operating knowledge current.', 'extract-1.webp'],
  ['Marketing planning', 'Prepare an executive review.', 'extract-4.webp'],
  ['HR onboarding', 'Run employee onboarding.', 'extract-7.webp'],
]

// Mirrors the control themes the established site ranks for: your cloud, your
// data, AI on your terms. Written as crawlable body copy rather than decoration.
const values = [
  {
    title: 'Your cloud, your rules',
    body: 'Deploy ShimoDocs into infrastructure you control — single-node or high-availability Kubernetes. Documents, metadata and permissions never leave your network boundary.',
  },
  {
    title: 'Data sovereignty by default',
    body: 'Enterprise permissions, audit logs, external-link controls and version history keep sensitive work traceable, reviewable and inside your own security model.',
  },
  {
    title: 'AI on your terms',
    body: 'Point the AI layer at the model provider you have approved. Agents work inside the document with a visible identity, a live cursor and a full edit history.',
  },
]

export default function Home() {
  const [word, setWord] = useState(0)
  const [scene, setScene] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setWord(v => (v + 1) % words.length), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="page home-page">
      <section className="hero-home">
        <div className="hero-copy">
          <Eyebrow>Self-hosted document collaboration</Eyebrow>
          <h1>
            ShimoDocs helps you work with{' '}
            <span className="rotating-word" key={word}>
              {words[word]}
            </span>{' '}
            <span className="gradient">in your private cloud.</span>
          </h1>
          <p>{PRODUCT_DEFINITION}</p>
          <div className="hero-actions">
            <a
              className="button download-cta"
              href={DOWNLOADS.amd64.url}
              data-analytics-event="download_click"
              data-download-arch="amd64"
              data-download-release={DOWNLOADS.version}
              data-analytics-surface="home_hero"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  d="M10 2.5v9m0 0-3.6-3.6M10 11.5l3.6-3.6M3.5 16.5h13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download for Linux · amd64
            </a>
            <a
              className="button outline license-cta"
              href={LICENSE_REQUEST_URL}
              data-analytics-event="license_request_click"
              data-analytics-surface="home_hero"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  d="M10 2.4 4.2 4.5v5c0 3.3 2.3 6.3 5.8 7.6 3.5-1.3 5.8-4.3 5.8-7.6v-5L10 2.4Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="m7.7 9.9 1.6 1.6 3-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Get a free perpetual license
            </a>
            <Link className="text-link" to="/ai-workspace">
              Explore AI Workspace ↗
            </Link>
          </div>
          <div className="download-meta">
            Self-hosted installer · {DOWNLOADS.amd64.size} ·{' '}
            <a
              href={DOWNLOADS.arm64.url}
              data-analytics-event="download_click"
              data-download-arch="arm64"
              data-download-release={DOWNLOADS.version}
              data-analytics-surface="home_meta"
            >
              arm64 build ↗
            </a>{' '}
            <a href={DOWNLOADS.latest} target="_blank" rel="noreferrer">
              All releases ↗
            </a>
          </div>
        </div>
        <div className="hero-scenes" id="scenes">
          <div className="hero-scenes-head">
            <Eyebrow>Built around real work</Eyebrow>
            <p>Pick a scene and watch the workspace move — every example is a real file type.</p>
          </div>
          <div className="scene-pills">
            {scenes.map(([label], i) => (
              <button key={label} type="button" onClick={() => setScene(i)} className={scene === i ? 'active' : ''}>
                {label}
              </button>
            ))}
          </div>
          <div className="scene-demo">
            <div className="scene-list">
              {scenes.map(([label, title], i) => (
                <button key={label} type="button" onClick={() => setScene(i)} className={scene === i ? 'active' : ''}>
                  <small>0{i + 1}</small>
                  {title}
                </button>
              ))}
            </div>
            <div className="scene-screen" key={scenes[scene][2]}>
              {/* The scene frame is the hero visual, so it stays eager and
                  decodes off the main thread rather than blocking paint. */}
              <img
                src={`/assets/${scenes[scene][2]}`}
                alt={`ShimoDocs workflow preview: ${scenes[scene][1]}`}
                width={imageSizes[scenes[scene][2]][0]}
                height={imageSizes[scenes[scene][2]][1]}
                fetchPriority="high"
                decoding="async"
              />
              <div className="scene-caption">
                <Eyebrow>Live workflow preview</Eyebrow>
                <h3>{scenes[scene][1]}</h3>
                <p>Shared context, visible handoffs and a clear next step for the team.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <ProductFacts showDefinition={false} />
      </section>

      <section className="section">
        <Eyebrow>Why teams self-host ShimoDocs</Eyebrow>
        <h2>
          Collaboration without
          <br />
          <span className="gradient">giving up control.</span>
        </h2>
        <p className="section-lead">
          Public cloud suites are convenient until your documents, prompts and audit trail live on someone else&apos;s
          infrastructure. ShimoDocs keeps the collaboration experience and returns the control.
        </p>
        <div className="value-grid">
          {values.map(value => (
            <article className="value-card" key={value.title}>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <Eyebrow>Everything your work needs</Eyebrow>
        <h2>
          Six capabilities.
          <br />
          <span className="gradient">One connected system.</span>
        </h2>
        <p className="section-lead">
          Docs, data, stories and intake live together, so teams can move from context to action without changing tools.
        </p>
        <div className="cap-grid">
          {caps.map(([title, desc, img], i) => (
            <article className="cap-card" key={title}>
              {/* Six capability cards sit well below the fold. Loading them
                  lazily keeps the initial viewport from competing with a
                  megabyte of screenshots for bandwidth. */}
              <img
                src={`/assets/${img}`}
                alt={`ShimoDocs ${title} interface in a private cloud deployment`}
                width={imageSizes[img][0]}
                height={imageSizes[img][1]}
                loading="lazy"
                decoding="async"
              />
              <div className="cap-overlay">
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <Eyebrow>Questions teams ask first</Eyebrow>
        <h2>
          Frequently asked
          <br />
          <span className="gradient">questions.</span>
        </h2>
        <div className="faq-list">
          {FAQS.map(faq => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section home-blog">
        <div>
          <Eyebrow>From the ShimoDocs journal</Eyebrow>
          <h2>
            Ideas for doing
            <br />
            <span className="gradient">better work.</span>
          </h2>
        </div>
        <Link className="text-link" to="/blog">
          Read the journal ↗
        </Link>
      </section>
    </div>
  )
}

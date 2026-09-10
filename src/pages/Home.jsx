import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Section'
import { DOWNLOADS } from '../downloads'
import { FAQS } from '../seo'

const words = ['Docs', 'Teams', 'AI']

const caps = [
  ['Documents', 'Real-time collaborative documents where teams write, comment and resolve feedback together', 'extract-1.png'],
  ['Writers', 'Polished word processing for every shared draft, contract and specification', 'extract-2.png'],
  ['Spreadsheets', 'Flexible spreadsheets for shared data, modelling and operational decisions', 'extract-3.png'],
  ['Presentations', 'Collaborative slides that keep the story moving from draft to review', 'extract-4.png'],
  ['App sheets', 'Apps and tables that keep projects, owners and deadlines on track', 'extract-5.png'],
  ['Forms', 'Forms that turn field responses into structured, usable context', 'extract-6.png'],
]

const scenes = [
  ['Knowledge management', 'Build a team knowledge hub.', 'extract-2.png'],
  ['Project management', 'Plan a project launch.', 'extract-3.png'],
  ['Meeting notes', 'Capture meeting decisions.', 'extract-6.png'],
  ['Policy & SOPs', 'Keep operating knowledge current.', 'extract-1.png'],
  ['Marketing planning', 'Prepare an executive review.', 'extract-4.png'],
  ['HR onboarding', 'Run employee onboarding.', 'extract-7.png'],
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
          <p>
            ShimoDocs is a self-hosted document collaboration platform: real-time docs, spreadsheets, presentations,
            forms and tables, with AI agents that work alongside your team — all inside your own private cloud.
          </p>
          <div className="hero-actions">
            <a className="button download-cta" href={DOWNLOADS.amd64.url}>
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
            <Link className="text-link" to="/ai-workspace">
              Explore AI Workspace ↗
            </Link>
            <a className="text-link" href="#scenes">
              See what teams do ↓
            </a>
          </div>
          <div className="download-meta">
            Self-hosted installer · {DOWNLOADS.amd64.size} ·{' '}
            <a href={DOWNLOADS.arm64.url}>arm64 build ↗</a> ·{' '}
            <a href={DOWNLOADS.latest} target="_blank" rel="noreferrer">
              All releases ↗
            </a>
          </div>
        </div>
        <div className="hero-product">
          <img
            src="/assets/extract-0.png"
            alt="ShimoDocs private cloud workspace showing a shared product launch plan with a comment from Shimo AI"
          />
          <div className="ai-cursor">
            <span>✦</span> AI
          </div>
          <div className="ai-comment">
            <div>
              <b>Shimo AI</b>
              <small>Just now</small>
              <i>✓</i>
            </div>
            <p>Grouped the launch tasks into a clearer sequence.</p>
            <em>AI suggestion</em>
          </div>
        </div>
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
              <img src={`/assets/${img}`} alt={`ShimoDocs ${title} interface in a private cloud deployment`} />
              <div className="cap-overlay">
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section scenes-section" id="scenes">
        <div className="section-heading">
          <div>
            <Eyebrow>Built around real work</Eyebrow>
            <h2>
              Pick a scene.
              <br />
              <span className="gradient">Watch it move.</span>
            </h2>
          </div>
          <p className="section-lead">Start with the work in front of you and keep every decision connected.</p>
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
          <div className="scene-screen">
            <img src={`/assets/${scenes[scene][2]}`} alt={`ShimoDocs workflow preview: ${scenes[scene][1]}`} />
            <div className="scene-caption">
              <Eyebrow>Live workflow preview</Eyebrow>
              <h3>{scenes[scene][1]}</h3>
              <p>Shared context, visible handoffs and a clear next step for the team.</p>
            </div>
          </div>
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

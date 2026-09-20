import { useMemo, useState } from 'react'
import { Eyebrow } from '../components/Section'
import { DOC_NAV } from '../generated/docs-nav'

// The guides are published on this site at /docs, so a repository path maps to a
// site path by dropping the extension and the README file name. Keeping the
// mapping here rather than hard-coding 19 hrefs means a renamed guide is caught
// by the build's link check instead of silently 404ing.
function docHref(repoPath) {
  const id = repoPath.replace(/\.md$/, '').replace(/\/README$/, '')
  return `/docs/${id}`
}

function sectionFor(doc) {
  const area = doc.id.split('/')[1]
  if (area === 'getting-started') return 'getting-started'
  if (area === 'operations-platform') return 'operations'
  if (area === 'troubleshooting') return 'troubleshooting'
  return 'deployment'
}

// Keep Help Center and /docs on the same generated source. Every published
// guide is present as a real href in the initial HTML, so discovery does not
// depend on the search box, a click, or a sitemap-only crawl.
const docs = DOC_NAV.flatMap(group => [
  ...group.docs,
  ...group.subgroups.flatMap(subgroup => subgroup.docs),
]).map(doc => [sectionFor(doc), doc.title, doc.description, doc.url.replace(/^\/docs\//, '')])
const groups={ 'getting-started':'Getting started', deployment:'Infrastructure and middleware', operations:'Operations platform', troubleshooting:'Troubleshooting and maintenance' }
export default function HelpCenter(){const [query,setQuery]=useState(''),[filter,setFilter]=useState('all'); const shown=useMemo(()=>docs.filter(d=>(filter==='all'||d[0]===filter)&&(!query||d.slice(1,3).join(' ').toLowerCase().includes(query.toLowerCase()))),[query,filter]); return <div className="page help-page"><section className="help-hero"><div><Eyebrow>Help Center · ShimoDocs Docs</Eyebrow><h1>Deploy with<br/><span className="gradient">confidence.</span></h1><p>The official repository guides for deploying, operating and troubleshooting ShimoDocs Suite in your private cloud.</p></div><div className="help-search"><label>Search the documentation</label><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Kubernetes, AI, backup..."/><small>{shown.length} matching guides · <a href="https://github.com/shimodocs/shimodocs/tree/main/docs" target="_blank" rel="noreferrer">Open on GitHub ↗</a></small></div></section><section className="help-surface"><div className="help-quick"><b>START HERE</b><h2>Choose your deployment path</h2><div>{[['Quick start','deployment/getting-started/quick-start.md'],['System requirements','deployment/system-requirements.md'],['Resource planning','deployment/getting-started/resource-planning.md'],['Installation troubleshooting','deployment/troubleshooting/installation.md']].map(([t,p],i)=><a key={t} href={docHref(p)} target="_blank" rel="noreferrer"><span>0{i+1}</span>{t}<em>↗</em></a>)}</div></div><div className="help-index"><aside><b>BROWSE THE REPO</b>{[['all','All docs'],...Object.entries(groups)].map(([key,label])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}<span>{key==='all'?docs.length:docs.filter(d=>d[0]===key).length}</span></button>)}</aside><div><b className="index-label">DOCUMENTATION INDEX</b><h2>Read the guide that matches your task</h2>{Object.entries(groups).map(([key,label])=>{const rows=shown.filter(d=>d[0]===key); if(!rows.length)return null; return <section className="doc-group" key={key}><h3>{label}</h3>{rows.map(([,title,desc,path],i)=><a className="doc-row" key={title} href={docHref(path)} target="_blank" rel="noreferrer"><span>0{i+1}</span><div><strong>{title}</strong><small>{desc}</small></div><em>↗</em></a>)}</section>})}{!shown.length&&<div className="empty">No document matches that search.</div>}</div></div></section></div>}

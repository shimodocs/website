// Product documentation pipeline.
//
// The guides are authored in the product repository (shimodocs/shimodocs) and
// mirrored into content/docs by `node scripts/sync-docs.mjs`. This module is
// the single reader used by both the prerenderer that turns each guide into a
// static page and the sitemap generator, so a guide can never appear in one
// place and be missing from the other.
//
// The guides carry no frontmatter — they are plain documentation written for
// GitHub. Titles come from the leading H1, descriptions from the opening
// paragraph, and both can be overridden in DOC_META where the derived value
// would be a poor search result.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import {
  DOCS_DEFAULT_LANGUAGE,
  DOCS_LANGUAGES,
  docsBase,
  docsUi,
  docsUrl,
  groupLabel as sharedGroupLabel,
  segmentLabel as sharedSegmentLabel,
} from '../src/docs-languages.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const DOCS_DIR = join(rootDir, 'content', 'docs')

export const DOCS_BASE = '/docs'
export const DOCS_TITLE_SUFFIX = ' | ShimoDocs'

// The translated trees sit in directories named after their language code, so
// walking content/docs recursively would file German deployment guides as
// English ones. English is whatever is not inside one of those directories.
const LANGUAGE_DIRS = new Set(DOCS_LANGUAGES.filter(language => language !== DOCS_DEFAULT_LANGUAGE))

function docsDirFor(language) {
  return language === DOCS_DEFAULT_LANGUAGE ? DOCS_DIR : join(DOCS_DIR, language)
}

export function docsLanguagesPresent() {
  return DOCS_LANGUAGES.filter(language => existsSync(docsDirFor(language)))
}

// ---------------------------------------------------------------- overrides

// Derived values are good for most guides. These are the ones where the
// opening paragraph makes a poor search snippet, or where the guide is a
// landing page that deserves a written description.
export const DOC_META = {
  deployment: {
    seoTitle: 'Deployment and Operations | ShimoDocs Documentation',
    description:
      'Plan, install, configure, operate and troubleshoot a private ShimoDocs Suite deployment, from system requirements through to incident response.',
  },
  'deployment/getting-started/quick-start': {
    seoTitle: 'ShimoDocs Quick Start | Install the Suite',
    description:
      'Install ShimoDocs Suite for the first time: prepare the installer and release package, check the environment and verify the deployment after it completes.',
  },
  'deployment/getting-started/single-node-kubernetes': {
    seoTitle: 'Single-Node Kubernetes Deployment | ShimoDocs',
    description:
      'Deploy an integrated single-node ShimoDocs Suite environment on Kubernetes, and retain the acceptance materials your audit or handover will ask for.',
  },
  'deployment/getting-started/high-availability-kubernetes': {
    seoTitle: 'High Availability Kubernetes Deployment | ShimoDocs',
    description:
      'Build a resilient ShimoDocs cluster: node topology, minimum server specifications, ACCESS_DOMAIN configuration and high-availability verification.',
  },
  'deployment/getting-started/resource-planning': {
    seoTitle: 'Resource Planning for ShimoDocs | Sizing Guide',
    description:
      'Size a ShimoDocs deployment: application node requirements, middleware baselines and object storage planning for single-node and clustered installs.',
  },
  'deployment/system-requirements': {
    seoTitle: 'System Requirements | ShimoDocs Self-Hosted',
    description:
      'Supported server resources, network access and deployment prerequisites for installing ShimoDocs Suite in your own private cloud infrastructure.',
  },
  'deployment/middleware/mysql/deployment': {
    seoTitle: 'Deploying ShimoDocs with MySQL 8 | Database Setup',
    description:
      'Prepare and connect MySQL 8 as the relational dependency for a self-hosted ShimoDocs Suite deployment, including requirements and connection settings.',
  },
  'deployment/middleware/redis/deployment': {
    seoTitle: 'Deploying ShimoDocs with Redis | Cache Setup',
    description:
      'Configure Redis for a ShimoDocs Suite deployment: the caching layer the collaboration services depend on, and how to wire it into the installer.',
  },
  'deployment/middleware/object-storage/deployment': {
    seoTitle: 'Object Storage for ShimoDocs | Deployment Guide',
    description:
      'Set up object storage for ShimoDocs Suite document files, including bucket configuration, credentials and how the deployment consumes the endpoint.',
  },
  'deployment/operations-platform': {
    seoTitle: 'Operations Platform Overview | ShimoDocs',
    description:
      'Map the ShimoDocs operations platform: suite administration for licences, tenants, users, brands and AI, plus the system services used in day-to-day ops.',
  },
  'deployment/operations-platform/suite/ai-configuration': {
    seoTitle: 'AI Configuration | ShimoDocs Self-Hosted AI Setup',
    description:
      'Configure the AI capability inside a self-hosted ShimoDocs Suite deployment, including the model endpoint your organisation has approved.',
  },
  'deployment/troubleshooting/data-backup': {
    seoTitle: 'ShimoDocs Data Backup | Databases and Object Storage',
    description:
      'Validate backup targets and back up the databases, object storage and configuration of a self-hosted ShimoDocs Suite deployment before you need a restore.',
  },
  'deployment/troubleshooting/incident-response-sop': {
    seoTitle: 'Incident Response SOP | ShimoDocs Operations',
    description:
      'A self-hosted incident response procedure for ShimoDocs Suite: gather evidence, contain impact, trace dependencies and verify recovery end to end.',
  },
  'deployment/troubleshooting/monitoring-metrics': {
    seoTitle: 'Monitoring Metrics Reference | ShimoDocs',
    description:
      'Read the key service, node and middleware signals during a ShimoDocs Suite incident, and know which metric tells you which dependency is failing.',
  },
  'deployment/troubleshooting/installation': {
    seoTitle: 'Installation Troubleshooting | ShimoDocs Suite',
    description:
      'Diagnose failed ShimoDocs Suite installations: time synchronisation, data disk paths, dependency failures and installer access problems.',
  },
  'deployment/troubleshooting/collaboration-editing-incident': {
    seoTitle: 'Collaborative Editing Incident | ShimoDocs Runbook',
    description:
      'Investigate collaborative editing symptoms in ShimoDocs Suite, from edit-link failures through node pressure to the middleware dependencies behind them.',
  },
  'deployment/middleware/dameng/requirements': {
    seoTitle: 'Dameng V8 Requirements | ShimoDocs',
    description:
      'Plan a Dameng DM8 deployment for ShimoDocs Suite: the server specification, operating system, parameter and network requirements the database must meet.',
  },
  'deployment/middleware/kafka/configuration': {
    seoTitle: 'Kafka Configuration | ShimoDocs Suite',
    description:
      'Complete the Kafka integration for a self-hosted ShimoDocs Suite deployment: the ports, topics and connection settings the message queue has to expose.',
  },
  'deployment/middleware/mongodb/configuration': {
    seoTitle: 'MongoDB Configuration | ShimoDocs Suite',
    description:
      'Finish connecting ShimoDocs Suite to an external MongoDB: the network access, credentials and document database settings the deployment expects.',
  },
  'deployment/operations-platform/suite/configuration/system-configuration': {
    seoTitle: 'System Configuration | ShimoDocs Operations',
    description:
      'Configure system-wide settings in the ShimoDocs Suite operations platform, for administrators and implementers setting the platform up for the first time.',
  },
  'deployment/operations-platform/suite/tenant-management': {
    seoTitle: 'Tenant Management | ShimoDocs Operations',
    description:
      'Manage tenants in the ShimoDocs Suite operations platform: review system-wide totals and adjust the organisational boundaries each tenant operates within.',
  },
  'deployment/operations-platform/system-services/control-panel/advanced-settings': {
    seoTitle: 'Advanced Settings | ShimoDocs Control Panel',
    description:
      'Edit the system custom pd-config as YAML from the ShimoDocs control panel, for advanced parameters and bulk configuration changes across a deployment.',
  },
  'deployment/operations-platform/system-services/middleware-tools/grpc': {
    seoTitle: 'gRPC Tool | ShimoDocs Operations Platform',
    description:
      'Use the gRPC tool in the ShimoDocs operations platform to inspect services across three target modes, from selecting an endpoint to reading the response.',
  },
  'deployment/operations-platform/system-services/middleware-tools/rdb': {
    seoTitle: 'Relational Database Tool | ShimoDocs Ops',
    description:
      'Query relational databases from the ShimoDocs operations platform: open a connection, pick a table, run SQL and read the result set without leaving the console.',
  },
  'deployment/operations-platform/system-services/middleware-tools/redis': {
    seoTitle: 'Redis Tool | ShimoDocs Operations Platform',
    description:
      'Inspect Redis from the ShimoDocs operations platform: search keys on the left, then read the value, type and TTL of the selected key on the right.',
  },
  'deployment/operations-platform/system-services/service-operations/configuration-center': {
    seoTitle: 'Configuration Center | ShimoDocs Ops',
    description:
      'View and modify application configuration for each ShimoDocs service, comparing the factory template against the values your deployment is running.',
  },
  'deployment/operations-platform/system-services/service-operations/real-time-logs': {
    seoTitle: 'Real-Time Logs | ShimoDocs Operations',
    description:
      'Stream service logs from across the Kubernetes cluster to locate ShimoDocs service anomalies, failed requests and slow dependencies as they happen.',
  },
  'deployment/operations-platform/system-services/service-operations/system-upgrade': {
    seoTitle: 'System Upgrade | ShimoDocs Suite',
    description:
      'Upload and apply a new ShimoDocs Suite installation package, with the pre-upgrade compatibility checks the operations platform runs before it starts.',
  },
  'deployment/operations-platform/system-services/toolset/container-packet-capture': {
    seoTitle: 'Container Packet Capture | ShimoDocs Ops',
    description:
      'Capture network traffic from running Pods to diagnose ShimoDocs connection failures, request timeouts and DNS problems inside the Kubernetes cluster.',
  },
}

// Search titles and descriptions for translated guides, written rather than
// derived.
//
// Only the two pages every translated tree is entered through are listed. The
// derived description is good enough for a runbook nobody arrives at cold, but
// "Note: why CentOS is no longer supported" is the wrong first impression for
// the page that answers "what server do I need", and the quick start is the
// page most search traffic lands on in every market.
const DOC_META_BY_LANGUAGE = {
  de: {
    'deployment/getting-started/quick-start': {
      seoTitle: 'ShimoDocs Schnellstart | Suite installieren',
      description:
        'ShimoDocs Suite erstmals installieren: Installer und Release-Paket vorbereiten, die Umgebung prüfen und die Bereitstellung anschließend verifizieren.',
    },
    'deployment/system-requirements': {
      seoTitle: 'Systemanforderungen | ShimoDocs Self-Hosted',
      description:
        'Unterstützte Serverressourcen, Netzwerkzugriff und Voraussetzungen für die Installation von ShimoDocs Suite in Ihrer eigenen Private-Cloud-Infrastruktur.',
    },
  },
  es: {
    'deployment/getting-started/quick-start': {
      seoTitle: 'Inicio rápido de ShimoDocs | Instalar la suite',
      description:
        'Instale ShimoDocs Suite por primera vez: prepare el instalador y el paquete, compruebe el entorno y verifique el despliegue cuando termine.',
    },
    'deployment/system-requirements': {
      seoTitle: 'Requisitos del sistema | ShimoDocs',
      description:
        'Recursos de servidor admitidos, acceso de red y requisitos previos para instalar ShimoDocs Suite en su propia infraestructura de nube privada.',
    },
  },
  fr: {
    'deployment/getting-started/quick-start': {
      seoTitle: 'Démarrage rapide ShimoDocs | Installer la suite',
      description:
        'Installez ShimoDocs Suite pour la première fois : préparez l’installateur et le paquet, vérifiez l’environnement puis validez le déploiement.',
    },
    'deployment/system-requirements': {
      seoTitle: 'Configuration requise | ShimoDocs auto-hébergé',
      description:
        'Ressources serveur prises en charge, accès réseau et prérequis pour installer ShimoDocs Suite dans votre propre infrastructure cloud privée.',
    },
  },
  ja: {
    'deployment/getting-started/quick-start': {
      seoTitle: 'ShimoDocs クイックスタート | セットアップ手順',
      description:
        'ShimoDocs Suite を初めてインストールする手順です。インストーラーと配布パッケージの準備、環境チェック、完了後の動作確認までを説明します。',
    },
    'deployment/system-requirements': {
      seoTitle: 'システム要件 | ShimoDocs セルフホスト',
      description:
        'セルフホスト環境で ShimoDocs Suite を導入するために必要なサーバーリソース、ネットワーク要件、事前準備をまとめています。',
    },
  },
  ko: {
    'deployment/getting-started/quick-start': {
      seoTitle: 'ShimoDocs 빠른 시작 | 설치 가이드',
      description:
        'ShimoDocs Suite를 처음 설치하는 과정입니다. 설치 프로그램과 배포 패키지 준비, 환경 점검, 설치 후 검증까지 다룹니다.',
    },
    'deployment/system-requirements': {
      seoTitle: '시스템 요구 사항 | ShimoDocs 셀프 호스팅',
      description:
        '셀프 호스팅 환경에 ShimoDocs Suite를 설치하기 위해 필요한 서버 자원, 네트워크 접근, 사전 요구 사항을 정리했습니다.',
    },
  },
  th: {
    'deployment/getting-started/quick-start': {
      seoTitle: 'เริ่มต้นอย่างรวดเร็ว | ติดตั้ง ShimoDocs Suite',
      description:
        'ขั้นตอนติดตั้ง ShimoDocs Suite ครั้งแรก เตรียมตัวติดตั้งและแพ็กเกจ ตรวจสอบสภาพแวดล้อม และตรวจยืนยันหลังการติดตั้งเสร็จ',
    },
    'deployment/system-requirements': {
      seoTitle: 'ข้อกำหนดของระบบ | ShimoDocs ติดตั้งเอง',
      description:
        'ทรัพยากรเซิร์ฟเวอร์ที่รองรับ การเข้าถึงเครือข่าย และข้อกำหนดเบื้องต้นสำหรับติดตั้ง ShimoDocs Suite ในโครงสร้างพื้นฐานคลาวด์ส่วนตัวของคุณ',
    },
  },
  vi: {
    'deployment/getting-started/quick-start': {
      seoTitle: 'Bắt đầu nhanh | Cài đặt ShimoDocs Suite',
      description:
        'Các bước cài đặt ShimoDocs Suite lần đầu: chuẩn bị trình cài đặt và gói phát hành, kiểm tra môi trường và xác minh sau khi hoàn tất.',
    },
    'deployment/system-requirements': {
      seoTitle: 'Yêu cầu hệ thống | ShimoDocs tự triển khai',
      description:
        'Tài nguyên máy chủ được hỗ trợ, quyền truy cập mạng và các điều kiện tiên quyết để cài đặt ShimoDocs Suite trên hạ tầng đám mây riêng của bạn.',
    },
  },
}

// Directory segments become navigation groups. The order sections appear in the
// sidebar: unlisted groups sort last, by label. The label for each segment is
// translated in src/docs-languages.js, which falls back to a title-cased
// version of the segment for anything it does not list.
const SEGMENT_ORDER = [
  'deployment',
  'getting-started',
  'middleware',
  'operations-platform',
  'suite',
  'configuration',
  'system-services',
  'business-control',
  'control-panel',
  'middleware-tools',
  'service-operations',
  'system-management',
  'toolset',
  'troubleshooting',
]

const CALLOUT_TYPES = {
  NOTE: 'Note',
  TIP: 'Tip',
  IMPORTANT: 'Important',
  WARNING: 'Warning',
  CAUTION: 'Caution',
}

// --------------------------------------------------------------- markdown

// GitHub-flavoured callouts: `> [!TIP]` on its own line at the top of a
// blockquote. markdown-it has no notion of them, so the marker is stripped and
// the blockquote is given a type. The label is emitted as real text rather than
// a CSS ::before, so it survives into the crawled page and into AI answers.
function calloutPlugin(md) {
  md.core.ruler.push('docs_callouts', state => {
    const { tokens, Token } = state
    for (let index = 0; index < tokens.length; index += 1) {
      if (tokens[index].type !== 'blockquote_open') continue

      let inline = null
      for (let scan = index + 1; scan < tokens.length; scan += 1) {
        if (tokens[scan].type === 'inline') {
          inline = tokens[scan]
          break
        }
        if (tokens[scan].type === 'blockquote_close') break
      }
      if (!inline) continue

      const match = /^\[!([A-Z]+)\]\s*/.exec(inline.content)
      if (!match) continue
      const label = CALLOUT_TYPES[match[1]]
      if (!label) continue

      const type = match[1].toLowerCase()
      tokens[index].attrSet('class', `doc-callout doc-callout-${type}`)

      for (const child of inline.children) {
        if (child.type === 'text' && child.content.startsWith(`[!${match[1]}]`)) {
          child.content = child.content.replace(/^\[![A-Z]+\]\s*/, '')
          break
        }
      }
      inline.content = inline.content.replace(/^\[![A-Z]+\]\s*/, '')

      inline.children.unshift(
        Object.assign(new Token('strong_open', 'strong', 1), {
          attrs: [['class', 'doc-callout-title']],
        }),
        Object.assign(new Token('text', '', 0), { content: label }),
        new Token('strong_close', 'strong', -1),
      )
    }
  })
}

// The guides live in a repository, so their links are repository links. Every
// one is rewritten to the page it maps to on this site.
function docLinksPlugin(md, resolveLink) {
  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    ((tokens, index, options, env, self) => self.renderToken(tokens, index, options))

  md.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const href = tokens[index].attrGet('href') || ''
    const mapped = resolveLink(href)
    if (mapped === null) {
      // A link to something this site does not publish. Leave the anchor text
      // in place and drop the link rather than shipping a dead href.
      tokens[index].attrSet('data-unresolved', href)
      tokens[index].tag = 'span'
      const close = tokens.find(
        (token, scan) => scan > index && token.type === 'link_close' && token.level === tokens[index].level,
      )
      if (close) close.tag = 'span'
      return self.renderToken(tokens, index, options)
    }
    tokens[index].attrSet('href', mapped)
    if (/^https?:\/\//i.test(mapped) && !/^https?:\/\/(www\.)?shimodocs\.com/i.test(mapped)) {
      tokens[index].attrSet('target', '_blank')
      tokens[index].attrSet('rel', 'noreferrer')
    }
    return defaultLinkOpen(tokens, index, options, env, self)
  }
}

function makeMarkdown(resolveLink) {
  return new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false })
    .use(calloutPlugin)
    .use(docLinksPlugin, resolveLink)
}

function slugifyHeading(text) {
  return String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function headingAnchorsPlugin(md) {
  md.core.ruler.push('collect_headings', state => {
    const used = new Map()
    state.env.headings = state.env.headings || []
    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index]
      if (token.type !== 'heading_open') continue
      const level = Number(token.tag.slice(1))
      if (level !== 2 && level !== 3) continue
      const inline = state.tokens[index + 1]
      const text = inline?.content?.trim() || ''
      if (!text) continue
      let id = slugifyHeading(text)
      const seen = used.get(id) || 0
      used.set(id, seen + 1)
      if (seen > 0) id = `${id}-${seen + 1}`
      token.attrSet('id', id)
      state.env.headings.push({ level, id, text: text.replace(/`/g, '') })
    }
  })
}

// ------------------------------------------------------------------ paths

// content/docs/deployment/middleware/mysql/deployment.md
//   -> deployment/middleware/mysql/deployment   (id, no extension)
//   -> /docs/deployment/middleware/mysql/deployment
// content/docs/deployment/README.md -> deployment -> /docs/deployment
export function docIdFor(relativePath) {
  let id = relativePath.split(sep).join(posix.sep).replace(/\.md$/, '')
  if (id === 'README') return ''
  return id.replace(/\/README$/, '')
}

// English keeps the unprefixed /docs tree; a translation keeps the same guide
// ids under its own prefix, which is what makes the hreflang pairs mechanical.
export function docUrlFor(id, language = DOCS_DEFAULT_LANGUAGE) {
  return docsUrl(language, id)
}

function fileForId(id) {
  return id ? `${id}.md` : 'README.md'
}

// ---------------------------------------------------------------- loading

function stripLanguageSwitcher(source) {
  // Every README in the repository opens with a row of links to the other
  // language trees. The row is a GitHub convention, not page content: left in,
  // it becomes the introduction of the documentation index and the first
  // paragraph a search snippet is derived from.
  //
  // Matched structurally — a line that is nothing but pipe-separated links —
  // because the translations point at `../README.md` while the English row
  // points at `./README.md`, and zh-CN is not published here at all.
  const linkRow = /^\s*\[[^\]]+\]\([^)]*\)(\s*\|\s*\[[^\]]+\]\([^)]*\))+\s*$/
  return source
    .split('\n')
    .filter(line => !linkRow.test(line))
    .join('\n')
}

function titleFrom(source, fallback) {
  const match = /^#\s+(.+?)\s*$/m.exec(source)
  return match ? match[1].trim() : fallback
}

// Removes the leading H1 so the page can render its own heading, avoiding two
// H1s in one document.
//
// Twelve of the guides are written as numbered walkthroughs that mark every
// section with `#` rather than `##`, which is fine on GitHub where the README is
// the only document, but produces twelve `<h1>` elements once it becomes a page.
// Where a guide uses more than one H1, everything below the title is shifted
// down one level so the body starts at H2. Guides that already use a single H1
// are left exactly as written.
function stripTitleAndNormaliseHeadings(source) {
  const lines = source.split('\n')
  const inFence = new Array(lines.length).fill(false)
  let fence = false
  let titleIndex = -1
  let h1Count = 0

  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) {
      fence = !fence
      inFence[index] = true
      continue
    }
    inFence[index] = fence
    if (fence) continue
    if (/^#\s+\S/.test(lines[index])) {
      h1Count += 1
      if (titleIndex === -1) titleIndex = index
    }
  }

  const demote = h1Count > 1
  const out = []
  for (let index = 0; index < lines.length; index += 1) {
    if (index === titleIndex) continue
    const line = lines[index]
    if (demote && index > titleIndex && !inFence[index]) {
      out.push(line.replace(/^(#{1,5})(\s)/, '#$1$2'))
    } else {
      out.push(line)
    }
  }
  return out.join('\n').replace(/^\s*\n/, '')
}

// A search snippet has to be a complete thought. Truncating a paragraph at a
// character count produces descriptions that end in "After." or "which.", so
// this collects whole sentences instead and stops once it has enough.
//
// Many of these guides open with a sentence addressed to whoever is holding the
// runbook ("This document is intended to guide implementation, operations, or
// integration personnel..."), which is useless in a search result. When the
// first sentence matches that shape it is dropped and the next one is used.
//
// The pattern has to exist in every published language rather than in English
// only: the Thai translation of that same sentence produced two guides with a
// byte-identical description, which is a duplicate-content warning in Search
// Console and a wasted search result.
const BOILERPLATE_OPENERS = [
  // en
  /^(This document|This article|This guide|This manual|This page|This section)\b/i,
  /^The IP addresses\b/i,
  // de
  /^(Dieses Dokument|Dieser Artikel|Diese Anleitung)\b/i,
  /^Die IP-Adressen\b/i,
  // es
  /^(Este documento|Este artículo|Esta guía)\b/i,
  /^Las direcciones IP\b/i,
  // fr
  /^(Ce document|Cet article|Ce guide)\b/i,
  /^Les adresses IP\b/i,
  // ja
  /^この(ドキュメント|文書|記事|ガイド)/,
  /^本書/,
  // ko
  /^이 (문서|글|가이드)/,
  // th
  /^(เอกสารฉบับนี้|บทความนี้|คู่มือนี้)/,
  /^IP พอร์ต และบัญชี/,
  // vi
  /^(Tài liệu này|Bài viết này|Hướng dẫn này)/,
  /^Địa chỉ IP\b/i,
]

// Whole paragraphs that carry no information out of context: the same
// "after configuring the network, target environment and node information,
// expand Advanced Configuration at the bottom of the page" sentence appears in
// every middleware guide.
const BOILERPLATE_PARAGRAPHS = [
  /^In the ['"“]?Configuration['"”]? step of the installer/i,
  /^ในขั้นตอน\s*['"“]?(การกำหนดค่า|Configuration)/,
]

function collectProse(source) {
  const lines = source.split('\n')
  const paragraphs = []
  let current = []
  let fence = false

  const flush = () => {
    if (current.length) {
      paragraphs.push(current.join(' '))
      current = []
    }
  }

  for (const raw of lines) {
    // A blockquote carries the document's introduction in many of these guides
    // ("Common installation problems fall into the following categories"), and
    // the Thai tree keeps its only opening sentence there — skipping the marker
    // rather than the line is what keeps those pages from shipping with no
    // description at all.
    let line = raw.trim()
    if (line.startsWith('>')) {
      line = line.replace(/^>\s?/, '').replace(/^\[![A-Z]+\]\s*/, '')
    }
    if (/^```/.test(line)) {
      fence = !fence
      flush()
      continue
    }
    if (fence) continue
    if (!line) {
      flush()
      continue
    }
    if (/^#{1,6}\s/.test(line) || /^\|/.test(line) || /^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
      flush()
      continue
    }
    if (/^</.test(line)) continue
    // A lone markdown link on its own line is the "back to the parent guide"
    // breadcrumb these guides open with, not prose.
    if (/^\[[^\]]*\]\([^)]*\)$/.test(line)) {
      flush()
      continue
    }
    current.push(line)
    if (paragraphs.length >= 4) break
  }
  flush()
  return paragraphs
}

function deriveDescription(source) {
  const paragraphs = collectProse(source)
  const sentences = []

  for (const paragraph of paragraphs) {
    const text = paragraph
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) continue
    // A line that ends in a colon is the lead-in to the list below it ("Before
    // you begin, confirm:"), not a sentence. Several Thai guides open with one,
    // and because Thai has no full stop the whole lead-in was collected as a
    // complete thought — five middleware guides ended up with byte-identical
    // descriptions.
    if (/[:：]\s*$/.test(text)) continue
    // Paragraphs that only tell the reader where to click in the installer are
    // identical across the middleware guides. They are accurate but useless as
    // a search snippet, and left in place the Thai tree produced five guides
    // with the same description.
    if (BOILERPLATE_PARAGRAPHS.some(pattern => pattern.test(text))) continue
    const found = text.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [text]
    for (const sentence of found) sentences.push(sentence.trim())
    if (sentences.length >= 6) break
  }

  // Several guides stack two of these ("This article explains how to..." then
  // "The IP addresses shown here are examples"), so the opener is dropped as
  // many times as it appears rather than once.
  while (sentences.length && BOILERPLATE_OPENERS.some(pattern => pattern.test(sentences[0]))) {
    sentences.shift()
  }

  let out = ''
  for (const sentence of sentences) {
    if (out && out.length + sentence.length + 1 > 160) break
    out = out ? `${out} ${sentence}` : sentence
    if (out.length >= 120) break
  }

  out = out.trim()
  if (!out) return ''
  if (out.length <= 160) return out
  return `${out.slice(0, 157).replace(/[,;:\s]\S*$/, '')}...`
}

function countWords(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`|\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

export function loadDocs(language = DOCS_DEFAULT_LANGUAGE) {
  const dir = docsDirFor(language)
  if (!existsSync(dir)) return []

  const files = []
  const walk = current => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      // An English walk must not descend into de/, es/, ja/ and treat a German
      // runbook as an English guide with an id of "de/...".
      if (entry.isDirectory()) {
        if (language === DOCS_DEFAULT_LANGUAGE && LANGUAGE_DIRS.has(entry.name)) continue
        walk(join(current, entry.name))
      } else if (entry.name.endsWith('.md')) {
        files.push(join(current, entry.name))
      }
    }
  }
  walk(dir)

  const byId = new Map()
  for (const file of files) {
    const rel = relative(dir, file)
    const id = docIdFor(rel)
    byId.set(id, file)
  }

  // Rewrites a repository-relative link into a site path, or null when the
  // target is not published here.
  const resolveLinkFor = fromId => href => {
    if (!href) return href
    if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href
    const [pathPart, hash = ''] = href.split('#')
    if (!pathPart) return href

    const fromDir = posix.dirname(fileForId(fromId))
    const target = posix.normalize(posix.join(fromDir, pathPart))
    if (!target.endsWith('.md')) return href

    const targetId = docIdFor(target)
    if (!byId.has(targetId)) return null
    return `${docUrlFor(targetId, language)}${hash ? `#${hash}` : ''}`
  }

  const docs = []
  for (const [id, file] of byId) {
    // The repository's root README is replaced on the site by the documentation
    // landing page at /docs, which carries the same introduction and links every
    // guide. Rendering it as a guide as well would publish /docs twice.
    if (id === '') continue

    const raw = loadRaw(file)
    const source = stripLanguageSwitcher(raw)
    const fallbackTitle = id ? titleCase(id.split('/').pop().replace(/-/g, ' ')) : 'Documentation'
    const title = titleFrom(source, fallbackTitle)
    const body = stripTitleAndNormaliseHeadings(source)

    const md = makeMarkdown(resolveLinkFor(id))
      .use(headingAnchorsPlugin)
    const env = { headings: [] }
    const html = md.render(body, env)

    // The written overrides are per language: the English table carries the
    // hand-written snippets for the whole tree, and the translated table covers
    // the few pages a translated market actually enters through. Deriving from
    // the translated opening paragraph is right for everything else.
    const meta =
      language === DOCS_DEFAULT_LANGUAGE
        ? DOC_META[id] || {}
        : (DOC_META_BY_LANGUAGE[language] || {})[id] || {}
    const description = meta.description || deriveDescription(body)
    const words = countWords(body)

    docs.push({
      id,
      language,
      url: docUrlFor(id, language),
      file: relative(rootDir, file),
      title,
      seoTitle: meta.seoTitle || `${title}${DOCS_TITLE_SUFFIX}`,
      description,
      html,
      headings: env.headings.filter(heading => heading.level === 2),
      words,
      readingTime: Math.max(1, Math.round(words / 200)),
      group: id.split('/')[0] || '',
      depth: id ? id.split('/').length : 0,
    })
  }

  return docs
}

// Every published language, loaded once. The prerenderer, the sitemap and the
// hreflang graph all read this instead of walking the tree again, so the three
// can never disagree about which guide exists in which language.
export function loadDocsByLanguage() {
  const byLanguage = new Map()
  for (const language of DOCS_LANGUAGES) {
    const docs = loadDocs(language)
    if (docs.length) byLanguage.set(language, docs)
  }
  return byLanguage
}

// Which languages publish a given guide id. Drives the hreflang alternates:
// pointing at a translation that does not exist is worse than emitting none.
export function languagesByDocId(byLanguage) {
  const map = new Map()
  for (const [language, docs] of byLanguage) {
    for (const doc of docs) {
      if (!map.has(doc.id)) map.set(doc.id, [])
      map.get(doc.id).push(language)
    }
  }
  for (const [id, languages] of map) map.set(id, languages.sort())
  return map
}

// The landing page of one language's guide tree.
//
// Its introduction comes from that language's own root README rather than from
// a string written here, so the index a German reader lands on is written in the
// German the translators produced, and a change upstream reaches the page
// without anyone editing this file.
export function loadDocsIndex(language = DOCS_DEFAULT_LANGUAGE) {
  const source = stripLanguageSwitcher(loadRaw(join(docsDirFor(language), 'README.md')))
  const ui = docsUi(language)
  const fallback = ui.indexEyebrow
  const title = titleFrom(source, fallback)
  const description = deriveDescription(source) || fallback
  const seoTitle = /shimodocs/i.test(title) ? title : `${title}${DOCS_TITLE_SUFFIX}`

  return {
    language,
    id: '',
    url: docsBase(language),
    file: relative(rootDir, join(docsDirFor(language), 'README.md')),
    title,
    seoTitle,
    description,
  }
}

function loadRaw(file) {
  return readFileSync(file, 'utf8')
}

function titleCase(value) {
  return value.replace(/\b\w/g, character => character.toUpperCase())
}

// ------------------------------------------------------------ navigation

// A stable reading order, derived from the repository tree so a new guide lands
// in the right place without anyone editing a list.
export function sortDocs(docs) {
  const rank = segment => {
    const index = SEGMENT_ORDER.indexOf(segment)
    return index === -1 ? SEGMENT_ORDER.length : index
  }
  return [...docs].sort((a, b) => {
    const aParts = a.id ? a.id.split('/') : []
    const bParts = b.id ? b.id.split('/') : []
    const len = Math.max(aParts.length, bParts.length)
    for (let index = 0; index < len; index += 1) {
      const aPart = aParts[index]
      const bPart = bParts[index]
      if (aPart === undefined) return -1
      if (bPart === undefined) return 1
      if (aPart === bPart) continue
      const aRank = rank(aPart)
      const bRank = rank(bPart)
      if (aRank !== bRank) return aRank - bRank
      const aIsDir = aParts.length > index + 1
      const bIsDir = bParts.length > index + 1
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
      return aPart.localeCompare(bPart)
    }
    return 0
  })
}

function segmentLabel(segment, language) {
  return sharedSegmentLabel(segment, language)
}

// The sidebar groups. The repository nests everything one level deeper than the
// navigation should, so a guide is assigned to a group by longest-prefix match
// rather than by its top-level directory — otherwise all 55 deployment guides
// would land in a single list.
const GROUPS = [
  { id: '' },
  { id: 'deployment/getting-started' },
  { id: 'deployment/middleware' },
  { id: 'deployment/operations-platform' },
  { id: 'deployment/troubleshooting' },
]

// Guides that do not sit under the directory their subject belongs to.
const GROUP_OVERRIDES = {
  deployment: '',
  'deployment/system-requirements': 'deployment/getting-started',
}

function groupOf(id) {
  if (id in GROUP_OVERRIDES) return GROUP_OVERRIDES[id]
  let best = ''
  for (const group of GROUPS) {
    if (!group.id) continue
    if (id === group.id || id.startsWith(`${group.id}/`)) {
      if (group.id.length > best.length) best = group.id
    }
  }
  return best
}

/**
 * Groups the guides into the sidebar.
 *
 * A group is a section such as "Middleware"; within a group, guides that live
 * in their own sub-directory (the MySQL pair, the toolset commands) are given a
 * labelled sub-heading so a long section stays scannable. Sub-groups are only
 * created where the repository itself has the extra directory, so a new guide
 * never needs a list edited by hand.
 */
export function buildNav(docs, language = DOCS_DEFAULT_LANGUAGE) {
  const ordered = sortDocs(docs)
  const groups = []
  const byId = new Map()

  for (const doc of ordered) {
    const groupId = groupOf(doc.id)
    let group = byId.get(groupId)
    if (!group) {
      group = { id: groupId, label: sharedGroupLabel(groupId, language), subgroups: [], docs: [] }
      byId.set(groupId, group)
      groups.push(group)
    }

    const remainder = groupId ? doc.id.slice(groupId.length + 1) : doc.id
    const parts = remainder ? remainder.split('/') : []
    // A sub-group exists only where the guide sits two or more levels below the
    // group root, which is exactly where the repository has a subject directory.
    const subgroupId = parts.length > 1 ? parts.slice(0, -1).join('/') : ''

    if (!subgroupId) {
      group.docs.push(doc)
      continue
    }
    let subgroup = group.subgroups.find(entry => entry.id === subgroupId)
    if (!subgroup) {
      subgroup = { id: subgroupId, label: segmentLabel(subgroupId.split('/').pop(), language), docs: [] }
      group.subgroups.push(subgroup)
    }
    subgroup.docs.push(doc)
  }

  const rank = segment => {
    const index = SEGMENT_ORDER.indexOf(segment)
    return index === -1 ? SEGMENT_ORDER.length : index
  }
  for (const group of groups) {
    group.subgroups.sort((a, b) => {
      const aTop = a.id.split('/')[0]
      const bTop = b.id.split('/')[0]
      if (aTop !== bTop) {
        const difference = rank(aTop) - rank(bTop)
        if (difference !== 0) return difference
        return aTop.localeCompare(bTop)
      }
      return a.id.localeCompare(b.id)
    })
  }

  return groups
}

export function withNeighbours(docs) {
  const ordered = sortDocs(docs)
  const position = new Map(ordered.map((doc, index) => [doc.id, index]))
  return ordered.map(doc => {
    const at = position.get(doc.id)
    return {
      ...doc,
      previous: at > 0 ? summary(ordered[at - 1]) : null,
      next: at < ordered.length - 1 ? summary(ordered[at + 1]) : null,
    }
  })
}

function summary(doc) {
  return { id: doc.id, url: doc.url, title: doc.title }
}

// The subset that is allowed into the browser bundle. Guide bodies are rendered
// into static HTML and never travel to the client, and the per-guide heading
// list is only needed by the prerendered page itself.
export function toDocClientRecord(doc) {
  return {
    id: doc.id,
    url: doc.url,
    title: doc.title,
    description: doc.description,
    group: doc.group,
    readingTime: doc.readingTime,
  }
}

// ------------------------------------------------------------------ seo

export function docsIndexJsonLd(docs, canonicalFor, description, language = DOCS_DEFAULT_LANGUAGE) {
  const ordered = sortDocs(docs)
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: loadDocsIndex(language).title,
    url: canonicalFor(docsBase(language)),
    inLanguage: language,
    description,
    hasPart: ordered.map(doc => ({
      '@type': 'TechArticle',
      headline: doc.title,
      url: canonicalFor(doc.url),
      description: doc.description,
    })),
  }
}

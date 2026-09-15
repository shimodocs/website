// Published documentation languages.
//
// The guides are authored in English in the product repository and translated
// there as complete mirrors. A language is published on this site only when it
// is listed here: scripts/sync-docs.mjs copies exactly these trees into
// content/docs, and scripts/docs-content.mjs renders exactly these trees, so a
// half-finished translation can never ship by accident.
//
// This module is imported by the client bundle, by the SSR entry and by the
// build scripts. It therefore has to stay free of Node imports.
//
// zh-CN is authored upstream but deliberately not published: shimodocs.com is
// the international site and the Chinese documentation belongs to shimo.net,
// so publishing both would have the two domains compete for the same queries.
//
// Only German and Japanese are published, and that is a deliberate pilot rather
// than a limit of the pipeline: the translations are complete mirrors but they
// are machine output, and no reader has been through them. Two markets with the
// strongest self-hosting demand and the thinnest English-language competition
// are enough to measure whether translated documentation earns traffic before
// another six are switched on. The interface strings for the other five are
// kept below so enabling one is a change to this array and nothing else.
export const DOCS_DEFAULT_LANGUAGE = 'en'

export const DOCS_LANGUAGES = ['en', 'de', 'ja']

export const LANGUAGE_META = {
  en: { label: 'English', ogLocale: 'en_US' },
  de: { label: 'Deutsch', ogLocale: 'de_DE' },
  es: { label: 'Español', ogLocale: 'es_ES' },
  fr: { label: 'Français', ogLocale: 'fr_FR' },
  ja: { label: '日本語', ogLocale: 'ja_JP' },
  ko: { label: '한국어', ogLocale: 'ko_KR' },
  th: { label: 'ไทย', ogLocale: 'th_TH' },
  vi: { label: 'Tiếng Việt', ogLocale: 'vi_VN' },
}

// English lives at /docs, every translation under its own prefix. Keeping the
// default language unprefixed is what the rest of the site already assumes, and
// it keeps the strongest pages one directory shallower than the translations.
export function docsBase(language = DOCS_DEFAULT_LANGUAGE) {
  return language === DOCS_DEFAULT_LANGUAGE ? '/docs' : `/${language}/docs`
}

export function docsUrl(language, id = '') {
  const base = docsBase(language)
  return id ? `${base}/${id}` : base
}

export function docsLanguageFromPath(pathname = '') {
  const match = /^\/([a-z]{2}(?:-[A-Za-z]{2})?)\/docs(?:\/|$)/.exec(pathname)
  if (match && DOCS_LANGUAGES.includes(match[1])) return match[1]
  return DOCS_DEFAULT_LANGUAGE
}

// ------------------------------------------------------------ interface text

// Every string that appears on a guide page or on a language's documentation
// index. Group and section headings are looked up by the same segment ids used
// in scripts/docs-content.mjs, so one table covers the sidebar, the breadcrumb
// and the index sections.
//
// Kept deliberately short: the guide bodies themselves are translated upstream
// and must never be duplicated here.
const EN = {
  overview: 'Overview',
  segments: {
    deployment: 'Deployment and operations',
    'getting-started': 'Getting started',
    middleware: 'Middleware',
    'operations-platform': 'Operations platform',
    suite: 'Suite administration',
    configuration: 'Configuration',
    'system-services': 'System services',
    'business-control': 'Business control',
    'control-panel': 'Control panel',
    'middleware-tools': 'Middleware tools',
    'service-operations': 'Service operations',
    'system-management': 'System management',
    toolset: 'Toolset',
    troubleshooting: 'Troubleshooting and maintenance',
    'object-storage': 'Object storage',
  },
  docsHome: 'Documentation home',
  home: 'Home',
  docs: 'Docs',
  minRead: n => `${n} min read`,
  editOnGitHub: 'Edit this page on GitHub',
  previous: 'Previous',
  next: 'Next',
  onThisPage: 'On this page',
  languageLabel: 'Language',
  ctaKicker: 'Run this in your own environment',
  ctaHeading: 'ShimoDocs is free for teams of up to five people',
  ctaBody:
    'Self-host the suite in your own Kubernetes cluster, or ask the team for a guided private cloud deployment.',
  ctaDownload: 'Download the installer',
  ctaContact: 'Talk to us',
  indexEyebrow: 'Documentation',
  indexQuickStart: 'Start with the quick start',
  indexRequirements: 'Check system requirements',
  indexCount: n => `${n} guides covering planning, installation, operations and troubleshooting.`,
}

const TRANSLATIONS = {
  de: {
    overview: 'Überblick',
    segments: {
      deployment: 'Deployment und Betrieb',
      'getting-started': 'Erste Schritte',
      middleware: 'Middleware',
      'operations-platform': 'Betriebsplattform',
      suite: 'Suite-Verwaltung',
      configuration: 'Konfiguration',
      'system-services': 'Systemdienste',
      'business-control': 'Geschäftssteuerung',
      'control-panel': 'Systemsteuerung',
      'middleware-tools': 'Middleware-Werkzeuge',
      'service-operations': 'Dienstbetrieb',
      'system-management': 'Systemverwaltung',
      toolset: 'Werkzeuge',
      troubleshooting: 'Fehlerbehebung und Wartung',
      'object-storage': 'Objektspeicher',
    },
    docsHome: 'Zurück zur Dokumentation',
    home: 'Startseite',
    docs: 'Dokumentation',
    minRead: n => `${n} Min. Lesezeit`,
    editOnGitHub: 'Diese Seite auf GitHub bearbeiten',
    previous: 'Zurück',
    next: 'Weiter',
    onThisPage: 'Auf dieser Seite',
    languageLabel: 'Sprache',
    ctaKicker: 'In Ihrer eigenen Umgebung betreiben',
    ctaHeading: 'ShimoDocs ist für Teams mit bis zu fünf Personen kostenlos',
    ctaBody:
      'Betreiben Sie die Suite in Ihrem eigenen Kubernetes-Cluster oder lassen Sie sich vom Team bei der Bereitstellung in Ihrer privaten Cloud begleiten.',
    ctaDownload: 'Installer herunterladen',
    ctaContact: 'Kontakt aufnehmen',
    indexEyebrow: 'Dokumentation',
    indexQuickStart: 'Mit dem Schnellstart beginnen',
    indexRequirements: 'Systemanforderungen prüfen',
    indexCount: n => `${n} Anleitungen zu Planung, Installation, Betrieb und Fehlerbehebung.`,
  },
  es: {
    overview: 'Resumen',
    segments: {
      deployment: 'Despliegue y operaciones',
      'getting-started': 'Primeros pasos',
      middleware: 'Middleware',
      'operations-platform': 'Plataforma de operaciones',
      suite: 'Administración de la suite',
      configuration: 'Configuración',
      'system-services': 'Servicios del sistema',
      'business-control': 'Control de negocio',
      'control-panel': 'Panel de control',
      'middleware-tools': 'Herramientas de middleware',
      'service-operations': 'Operación de servicios',
      'system-management': 'Gestión del sistema',
      toolset: 'Herramientas',
      troubleshooting: 'Solución de problemas y mantenimiento',
      'object-storage': 'Almacenamiento de objetos',
    },
    docsHome: 'Volver a la documentación',
    home: 'Inicio',
    docs: 'Documentación',
    minRead: n => `${n} min de lectura`,
    editOnGitHub: 'Editar esta página en GitHub',
    previous: 'Anterior',
    next: 'Siguiente',
    onThisPage: 'En esta página',
    languageLabel: 'Idioma',
    ctaKicker: 'Ejecútelo en su propio entorno',
    ctaHeading: 'ShimoDocs es gratis para equipos de hasta cinco personas',
    ctaBody:
      'Instale la suite en su propio clúster de Kubernetes o pida al equipo un despliegue guiado en su nube privada.',
    ctaDownload: 'Descargar el instalador',
    ctaContact: 'Hable con nosotros',
    indexEyebrow: 'Documentación',
    indexQuickStart: 'Empezar con la guía rápida',
    indexRequirements: 'Ver los requisitos del sistema',
    indexCount: n => `${n} guías sobre planificación, instalación, operación y resolución de problemas.`,
  },
  fr: {
    overview: 'Vue d’ensemble',
    segments: {
      deployment: 'Déploiement et exploitation',
      'getting-started': 'Prise en main',
      middleware: 'Intergiciels',
      'operations-platform': 'Plateforme d’exploitation',
      suite: 'Administration de la suite',
      configuration: 'Configuration',
      'system-services': 'Services système',
      'business-control': 'Contrôle métier',
      'control-panel': 'Panneau de configuration',
      'middleware-tools': 'Outils d’intergiciel',
      'service-operations': 'Exploitation des services',
      'system-management': 'Gestion du système',
      toolset: 'Boîte à outils',
      troubleshooting: 'Dépannage et maintenance',
      'object-storage': 'Stockage objet',
    },
    docsHome: 'Retour à la documentation',
    home: 'Accueil',
    docs: 'Documentation',
    minRead: n => `${n} min de lecture`,
    editOnGitHub: 'Modifier cette page sur GitHub',
    previous: 'Précédent',
    next: 'Suivant',
    onThisPage: 'Sur cette page',
    languageLabel: 'Langue',
    ctaKicker: 'Exécutez-le dans votre propre environnement',
    ctaHeading: 'ShimoDocs est gratuit pour les équipes de cinq personnes maximum',
    ctaBody:
      'Installez la suite dans votre propre cluster Kubernetes ou demandez à l’équipe un déploiement privé accompagné.',
    ctaDownload: 'Télécharger l’installateur',
    ctaContact: 'Nous contacter',
    indexEyebrow: 'Documentation',
    indexQuickStart: 'Commencer par le démarrage rapide',
    indexRequirements: 'Vérifier la configuration requise',
    indexCount: n => `${n} guides couvrant la planification, l’installation, l’exploitation et le dépannage.`,
  },
  ja: {
    overview: '概要',
    segments: {
      deployment: 'デプロイと運用',
      'getting-started': 'はじめに',
      middleware: 'ミドルウェア',
      'operations-platform': '運用プラットフォーム',
      suite: 'スイート管理',
      configuration: '設定',
      'system-services': 'システムサービス',
      'business-control': '業務制御',
      'control-panel': 'コントロールパネル',
      'middleware-tools': 'ミドルウェアツール',
      'service-operations': 'サービス運用',
      'system-management': 'システム管理',
      toolset: 'ツールセット',
      troubleshooting: 'トラブルシューティングと保守',
      'object-storage': 'オブジェクトストレージ',
    },
    docsHome: 'ドキュメントに戻る',
    home: 'ホーム',
    docs: 'ドキュメント',
    minRead: n => `約${n}分で読めます`,
    editOnGitHub: 'このページを GitHub で編集',
    previous: '前へ',
    next: '次へ',
    onThisPage: 'このページの内容',
    languageLabel: '言語',
    ctaKicker: 'ご自身の環境で実行',
    ctaHeading: 'ShimoDocs は 5 名までのチームなら無料です',
    ctaBody:
      '自社の Kubernetes クラスタにセルフホストするか、チームによるプライベートクラウド構築の支援をご依頼ください。',
    ctaDownload: 'インストーラーをダウンロード',
    ctaContact: 'お問い合わせ',
    indexEyebrow: 'ドキュメント',
    indexQuickStart: 'クイックスタートを始める',
    indexRequirements: 'システム要件を確認する',
    indexCount: n => `計画、インストール、運用、トラブルシューティングを扱う${n}件のガイド。`,
  },
  ko: {
    overview: '개요',
    segments: {
      deployment: '배포 및 운영',
      'getting-started': '시작하기',
      middleware: '미들웨어',
      'operations-platform': '운영 플랫폼',
      suite: '스위트 관리',
      configuration: '구성',
      'system-services': '시스템 서비스',
      'business-control': '업무 제어',
      'control-panel': '제어판',
      'middleware-tools': '미들웨어 도구',
      'service-operations': '서비스 운영',
      'system-management': '시스템 관리',
      toolset: '도구 모음',
      troubleshooting: '문제 해결 및 유지 관리',
      'object-storage': '오브젝트 스토리지',
    },
    docsHome: '문서로 돌아가기',
    home: '홈',
    docs: '문서',
    minRead: n => `약 ${n}분`,
    editOnGitHub: 'GitHub에서 이 페이지 편집',
    previous: '이전',
    next: '다음',
    onThisPage: '이 페이지의 내용',
    languageLabel: '언어',
    ctaKicker: '직접 환경에서 실행하세요',
    ctaHeading: 'ShimoDocs는 최대 5명 팀까지 무료입니다',
    ctaBody: '자체 Kubernetes 클러스터에 직접 설치하거나, 팀에 프라이빗 클라우드 구축 지원을 요청하세요.',
    ctaDownload: '설치 프로그램 다운로드',
    ctaContact: '문의하기',
    indexEyebrow: '문서',
    indexQuickStart: '빠른 시작으로 이동',
    indexRequirements: '시스템 요구 사항 확인',
    indexCount: n => `계획, 설치, 운영, 문제 해결을 다루는 가이드 ${n}개.`,
  },
  th: {
    overview: 'ภาพรวม',
    segments: {
      deployment: 'การติดตั้งใช้งานและปฏิบัติการ',
      'getting-started': 'เริ่มต้นใช้งาน',
      middleware: 'มิดเดิลแวร์',
      'operations-platform': 'แพลตฟอร์มปฏิบัติการ',
      suite: 'การจัดการชุดผลิตภัณฑ์',
      configuration: 'การตั้งค่า',
      'system-services': 'บริการของระบบ',
      'business-control': 'การควบคุมธุรกิจ',
      'control-panel': 'แผงควบคุม',
      'middleware-tools': 'เครื่องมือมิดเดิลแวร์',
      'service-operations': 'การปฏิบัติการบริการ',
      'system-management': 'การจัดการระบบ',
      toolset: 'ชุดเครื่องมือ',
      troubleshooting: 'การแก้ไขปัญหาและการบำรุงรักษา',
      'object-storage': 'ที่เก็บข้อมูลแบบออบเจ็กต์',
    },
    docsHome: 'กลับไปที่เอกสาร',
    home: 'หน้าแรก',
    docs: 'เอกสาร',
    minRead: n => `อ่านประมาณ ${n} นาที`,
    editOnGitHub: 'แก้ไขหน้านี้บน GitHub',
    previous: 'ก่อนหน้า',
    next: 'ถัดไป',
    onThisPage: 'ในหน้านี้',
    languageLabel: 'ภาษา',
    ctaKicker: 'รันในสภาพแวดล้อมของคุณเอง',
    ctaHeading: 'ShimoDocs ใช้ฟรีสำหรับทีมไม่เกิน 5 คน',
    ctaBody:
      'ติดตั้งชุดซอฟต์แวร์บนคลัสเตอร์ Kubernetes ของคุณเอง หรือขอให้ทีมงานช่วยติดตั้งระบบคลาวด์ส่วนตัว',
    ctaDownload: 'ดาวน์โหลดตัวติดตั้ง',
    ctaContact: 'ติดต่อเรา',
    indexEyebrow: 'เอกสาร',
    indexQuickStart: 'เริ่มจากคู่มือเริ่มต้นอย่างรวดเร็ว',
    indexRequirements: 'ตรวจสอบข้อกำหนดของระบบ',
    indexCount: n => `คู่มือ ${n} ฉบับ ครอบคลุมการวางแผน การติดตั้ง การปฏิบัติการ และการแก้ไขปัญหา`,
  },
  vi: {
    overview: 'Tổng quan',
    segments: {
      deployment: 'Triển khai và vận hành',
      'getting-started': 'Bắt đầu',
      middleware: 'Phần mềm trung gian',
      'operations-platform': 'Nền tảng vận hành',
      suite: 'Quản trị bộ sản phẩm',
      configuration: 'Cấu hình',
      'system-services': 'Dịch vụ hệ thống',
      'business-control': 'Kiểm soát nghiệp vụ',
      'control-panel': 'Bảng điều khiển',
      'middleware-tools': 'Công cụ trung gian',
      'service-operations': 'Vận hành dịch vụ',
      'system-management': 'Quản lý hệ thống',
      toolset: 'Bộ công cụ',
      troubleshooting: 'Xử lý sự cố và bảo trì',
      'object-storage': 'Lưu trữ đối tượng',
    },
    docsHome: 'Quay lại tài liệu',
    home: 'Trang chủ',
    docs: 'Tài liệu',
    minRead: n => `Đọc trong ${n} phút`,
    editOnGitHub: 'Sửa trang này trên GitHub',
    previous: 'Trước',
    next: 'Tiếp',
    onThisPage: 'Trong trang này',
    languageLabel: 'Ngôn ngữ',
    ctaKicker: 'Chạy trong môi trường của bạn',
    ctaHeading: 'ShimoDocs miễn phí cho nhóm tối đa năm người',
    ctaBody:
      'Tự triển khai bộ sản phẩm trên cụm Kubernetes của bạn, hoặc đề nghị đội ngũ hỗ trợ triển khai đám mây riêng.',
    ctaDownload: 'Tải trình cài đặt',
    ctaContact: 'Liên hệ với chúng tôi',
    indexEyebrow: 'Tài liệu',
    indexQuickStart: 'Bắt đầu với hướng dẫn nhanh',
    indexRequirements: 'Xem yêu cầu hệ thống',
    indexCount: n => `${n} hướng dẫn về lập kế hoạch, cài đặt, vận hành và xử lý sự cố.`,
  },
}

export function docsUi(language = DOCS_DEFAULT_LANGUAGE) {
  if (language === DOCS_DEFAULT_LANGUAGE) return EN
  return TRANSLATIONS[language] || EN
}

// The product names in the sidebar are the same in every language, so they are
// not duplicated per locale: only the surrounding words are.
const SHARED_SEGMENTS = {
  mysql: 'MySQL 8',
  redis: 'Redis',
  mongodb: 'MongoDB',
  kafka: 'Kafka',
  dameng: 'Dameng',
}

export function segmentLabel(segment, language = DOCS_DEFAULT_LANGUAGE) {
  if (SHARED_SEGMENTS[segment]) return SHARED_SEGMENTS[segment]
  const ui = docsUi(language)
  return ui.segments[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, character => character.toUpperCase())
}

// "Troubleshooting and maintenance" reads "Troubleshooting and maintenances"
// nowhere, but German and Japanese do inflect: the group heading is a phrase a
// person reads, so it is a separate string from the directory name it is
// derived from.
export function groupLabel(groupId, language = DOCS_DEFAULT_LANGUAGE) {
  if (!groupId) return docsUi(language).overview
  return segmentLabel(groupId.split('/').pop(), language)
}

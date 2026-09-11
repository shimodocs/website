// Self-hosted installer artifacts published from the shimodocs/shimodocs
// releases.
//
// Note on provenance: shimodocs.com has no working download surface. Its
// /download page renders "Coming Soon", no page on that site links to an
// installer, and no download hostname exists. The Chinese enterprise download
// centre at shimo.net serves the -cn build plus the k3s release tarball; the
// global build below is the package that matches this English site.
const RELEASES_URL = 'https://github.com/shimodocs/shimodocs/releases'

// GitHub's /releases/latest/download/<name> path always resolves to the newest
// release, so only the version inside the file name has to change when the
// installer is rebuilt. Nothing else on the site needs editing.
const INSTALLER_VERSION = 'v1.8.1-rc12'

function installer(arch, size) {
  return {
    arch,
    size,
    url: `${RELEASES_URL}/latest/download/mdp-installer-${arch}-${INSTALLER_VERSION}-global.zip`,
  }
}

export const DOWNLOADS = {
  releases: RELEASES_URL,
  latest: `${RELEASES_URL}/latest`,
  version: INSTALLER_VERSION.replace(/^v/, ''),
  amd64: installer('amd64', '357 MB'),
  arm64: installer('arm64', '325 MB'),
}

// Licence requests. The repository README documents this address as the
// official channel for the global build: "Request free by emailing
// support.global@shimo.im", free forever for five users with no credit card.
export const LICENSE_EMAIL = 'support.global@shimo.im'

const LICENSE_SUBJECT = 'Free perpetual ShimoDocs license request'

// A prefilled body turns a bare mailto into a usable request form and saves a
// round trip, because the details we need are already in the message.
const LICENSE_BODY = [
  'Hi ShimoDocs team,',
  '',
  'We would like to request the free perpetual ShimoDocs license.',
  '',
  'Company:',
  'Team size:',
  'Deployment environment (cloud / data centre / on-premise):',
  '',
  'Thanks',
].join('\n')

export const LICENSE_REQUEST_URL = `mailto:${LICENSE_EMAIL}?subject=${encodeURIComponent(
  LICENSE_SUBJECT,
)}&body=${encodeURIComponent(LICENSE_BODY)}`


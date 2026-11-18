/**
 * Domain canonicalisation — adapted from devpeer-net/website-blocker (MIT).
 * Pure: no chrome.* namespace, no DOM.
 */

/** A canonical host: lowercase ASCII/punycode, no scheme, port, path or trailing dot. */
export function normalizeDomain(input) {
  let s = String(input ?? '').trim().toLowerCase()
  if (!s) return null

  s = s.replace(/^\*\.?/, '')
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(s)) s = `https://${s}`

  let url
  try {
    url = new URL(s)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const host = url.hostname.replace(/\.+$/, '')
  if (host.startsWith('[')) {
    return /^\[[0-9a-f:.]+\]$/.test(host) ? host : null
  }

  // Strip www. exhaustively: keeping it would leave old.reddit.com reachable
  // after blocking www.reddit.com. Over-blocking is the safe direction.
  let canonical = host
  while (canonical.startsWith('www.')) canonical = canonical.slice(4)
  if (!canonical.includes('.')) return null

  const labels = canonical.split('.')
  if (!labels.every((label) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label))) return null

  return canonical
}

/** True when `host` is `parent` or any subdomain of it. Label-boundary aware. */
export function covers(parent, host) {
  return host === parent || host.endsWith(`.${parent}`)
}

/** Parse a hosts-file entry (`0.0.0.0 example.com`) into a canonical domain. */
export function parseHostsLine(line) {
  const trimmed = String(line ?? '').trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const parts = trimmed.split(/\s+/)
  const host = parts.find((part) => part && !/^\d/.test(part) && part.includes('.'))
  return host ? normalizeDomain(host) : null
}

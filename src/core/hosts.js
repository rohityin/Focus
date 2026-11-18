/**
 * Shared parser for the bundled curated hosts list.
 * Used both by the Node build script and by the service worker at install time.
 */
import { normalizeDomain } from './domain.js'

/** Parse a hosts-format document into a sorted, deduplicated list of canonical domains. */
export function parseHosts(text) {
  const found = new Set()
  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const parts = line.split(/\s+/)
    for (const candidate of parts.slice(1)) {
      const domain = normalizeDomain(candidate)
      if (domain) found.add(domain)
    }
  }
  return [...found].sort()
}

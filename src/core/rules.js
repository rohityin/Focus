/**
 * declarativeNetRequest rule construction — adapted from devpeer-net/website-blocker (MIT).
 * Pure: plain objects in, plain objects out, so the whole rule set is snapshot-testable.
 */

/** Domains per rule. Keeps rule count far under every DNR cap. */
export const CHUNK_SIZE = 500
export const RULE_ID_BASE = 1000
/** Static safety-net rules start at 1; dynamic redirect rules at 1000. */
export const STATIC_ID_BASE = 1

/**
 * Build redirect rules: priority 2 sends a navigation to our block page with the
 * original URL in the fragment. A fragment, not a query parameter, so a blocked
 * URL's own `&foo=bar` cannot become a parameter of our page.
 *
 * `resourceTypes: ['main_frame']` is mandatory: Chrome's default excludes
 * main_frame, so omitting it ships a blocker that never blocks the page itself.
 */
export function buildRedirectRules(domains, blockedPageUrl, idBase = RULE_ID_BASE) {
  const rules = []
  for (let i = 0; i * CHUNK_SIZE < domains.length; i++) {
    rules.push({
      id: idBase + i * 2,
      priority: 2,
      action: {
        type: 'redirect',
        redirect: { regexSubstitution: `${blockedPageUrl}#\\0` },
      },
      condition: {
        requestDomains: domains.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        regexFilter: '^https?://.*',
        resourceTypes: ['main_frame'],
      },
    })
  }
  return rules
}

/**
 * Safety-net `block` rules at priority 1. If the dynamic redirect rules are
 * ever cleared, these still stop navigation (Chrome grants safe actions
 * implicit access, so they work even with restricted site access).
 */
export function buildBlockRules(domains, idBase = STATIC_ID_BASE) {
  const rules = []
  for (let i = 0; i * CHUNK_SIZE < domains.length; i++) {
    rules.push({
      id: idBase + i,
      priority: 1,
      action: { type: 'block' },
      condition: {
        requestDomains: domains.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        resourceTypes: ['main_frame'],
      },
    })
  }
  return rules
}

/** Chunk an arbitrary list into arrays of at most `size`. */
export function chunk(items, size = CHUNK_SIZE) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

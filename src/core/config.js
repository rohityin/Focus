/**
 * Config schema and validation. The config is written exactly once, during
 * first-run setup, and is read-only afterwards (hard lock).
 */
import { normalizeDomain } from './domain.js'

export const STORAGE_KEY = 'focus.config'
export const SCHEMA_VERSION = 1

export function defaultConfig() {
  return {
    version: SCHEMA_VERSION,
    locked: false,
    lockedAt: null,
    categories: [],
    blockedCount: 0,
  }
}

export function validateDraft(draft) {
  const categories = draft?.categories
  if (!Array.isArray(categories) || categories.length === 0) {
    return { ok: false, error: 'Add at least one category.' }
  }

  const seen = new Set()
  const clean = []
  for (const category of categories) {
    const name = String(category?.name ?? '').trim()
    if (!name || name.length > 60) {
      return { ok: false, error: 'Every category needs a name (max 60 characters).' }
    }
    const rawDomains = Array.isArray(category?.domains) ? category.domains : []
    const domains = new Set()
    for (const raw of rawDomains) {
      const domain = normalizeDomain(raw)
      if (domain) domains.add(domain)
    }
    if (category?.builtin && domains.size === 0) {
      return { ok: false, error: `The built-in list for "${name}" is missing.` }
    }
    clean.push({
      id: String(category?.id ?? name).toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      name,
      builtin: category?.builtin === true,
      enabled: category?.enabled !== false,
      domains: [...domains].sort(),
    })
  }

  for (const category of clean) {
    if (seen.has(category.id)) {
      return { ok: false, error: `Duplicate category id: ${category.id}` }
    }
    seen.add(category.id)
  }

  if (!clean.some((category) => category.builtin && category.enabled)) {
    return { ok: false, error: 'Keep the built-in adult list enabled.' }
  }

  return { ok: true, config: { ...defaultConfig(), categories: clean } }
}

/** All enabled domains across all enabled categories. */
export function enabledDomains(config) {
  const result = new Set()
  for (const category of config?.categories ?? []) {
    if (category.enabled) for (const domain of category.domains) result.add(domain)
  }
  return [...result].sort()
}

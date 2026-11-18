/**
 * MV3 service worker.
 *
 * Listeners are registered synchronously at module top level — registering
 * after an await misses events on cold start, which is the normal case.
 * Two patterns borrowed from open source:
 *  - devpeer-net/website-blocker: storage -> syncRules() is the only path
 *    that writes rules; redirect + block fallback; sweep already-open tabs.
 *  - Sam-Wo/blocker-extension: a one-minute alarm re-applies rules as a
 *    self-heal if anything clears them.
 */
import { validateDraft, enabledDomains } from '../core/config.js'
import { covers } from '../core/domain.js'
import { parseHosts } from '../core/hosts.js'
import { buildRedirectRules } from '../core/rules.js'
import { readConfig, writeConfig, onConfigChanged } from '../core/storage.js'

const HOSTS_URL = chrome.runtime.getURL('data/hosts.txt')
const BLOCKED_URL = chrome.runtime.getURL('src/blocked/blocked.html')
const HEAL_ALARM = 'focus-heal'

async function bundledDomains() {
  const response = await fetch(HOSTS_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Cannot read bundled list: ${response.status}`)
  return parseHosts(await response.text())
}

/** Create the one-time, unlocked draft on first install. */
async function ensureDraft() {
  const config = await readConfig()
  if (config.version && Array.isArray(config.categories)) return config

  const domains = await bundledDomains()
  const draft = {
    ...config,
    categories: [
      {
        id: 'adult',
        name: 'Adult content',
        builtin: true,
        enabled: true,
        domains,
      },
    ],
  }
  await writeConfig(draft)
  return draft
}

/** Serialized: read-modify-write over the rule set must never overlap. */
let pending = Promise.resolve()
function syncRules() {
  pending = pending.then(runSync, runSync)
  return pending
}

async function runSync() {
  const config = await readConfig()
  if (!config.locked) return

  const domains = enabledDomains(config)
  const rules = buildRedirectRules(domains, BLOCKED_URL)
  const existing = await chrome.declarativeNetRequest.getDynamicRules()

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map((rule) => rule.id),
      addRules: rules,
    })
  } catch (error) {
    await chrome.storage.local.set({
      'focus.lastSyncError': error instanceof Error ? error.message : String(error),
    })
    return
  }
  await chrome.storage.local.set({ 'focus.lastSyncError': null })
  await sweepOpenTabs(domains)
}

/** DNR only sees new requests. Redirect tabs already sitting on a blocked site. */
async function sweepOpenTabs(domains) {
  if (domains.length === 0) return
  const set = new Set(domains)
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] })
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id === undefined || !tab.url) return
      let host
      try {
        host = new URL(tab.url).hostname.replace(/^www\./, '')
      } catch {
        return
      }
      if (!set.has(host)) return
      await chrome.tabs.update(tab.id, { url: `${BLOCKED_URL}#${tab.url}` }).catch(() => {})
    }),
  )
}

function publicStatus(config) {
  return {
    locked: config.locked,
    lockedAt: config.lockedAt,
    blockedCount: config.blockedCount ?? 0,
    categories: (config.categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      builtin: category.builtin,
      enabled: category.enabled,
      domainCount: category.domains.length,
    })),
  }
}

async function handleMessage(message) {
  switch (message?.type) {
    case 'status': {
      const config = await readConfig()
      return publicStatus(config)
    }
    case 'draft': {
      const config = await ensureDraft()
      if (config.locked) return { locked: true, categories: [] }
      return {
        locked: false,
        categories: config.categories.map((category) => ({
          id: category.id,
          name: category.name,
          builtin: category.builtin,
          enabled: category.enabled,
          domains: category.domains,
        })),
      }
    }
    case 'lock': {
      const config = await readConfig()
      if (config.locked) return { ok: false, error: 'Focus is already locked.' }
      const result = validateDraft(message.draft)
      if (!result.ok) return result
      await writeConfig({ ...config, ...result.config, locked: true, lockedAt: Date.now() })
      await syncRules()
      return { ok: true }
    }
    case 'blocked': {
      const config = await readConfig()
      let known = false
      try {
        const host = new URL(message.url).hostname.replace(/^www\./, '')
        known = enabledDomains(config).some((domain) => covers(domain, host))
      } catch {
        known = false
      }
      if (known) {
        await writeConfig({ ...config, blockedCount: (config.blockedCount ?? 0) + 1 })
      }
      return { ok: true, known }
    }
    default:
      return { ok: false, error: 'Unknown message' }
  }
}

// --- listeners (all synchronous) -------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  void ensureDraft()
    .then(() => syncRules())
    .then(() => chrome.alarms.create(HEAL_ALARM, { periodInMinutes: 1 }))
    .catch((error) => console.error('[focus] install failed', error))
})

chrome.runtime.onStartup.addListener(() => {
  void syncRules().catch((error) => console.error('[focus] sync failed', error))
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HEAL_ALARM) {
    void syncRules().catch((error) => console.error('[focus] heal failed', error))
  }
})

onConfigChanged(() => {
  void syncRules().catch((error) => console.error('[focus] sync failed', error))
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: String(error) }))
  return true
})

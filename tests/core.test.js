import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDomain, covers, parseHostsLine } from '../src/core/domain.js'
import { parseHosts } from '../src/core/hosts.js'
import { buildRedirectRules, buildBlockRules } from '../src/core/rules.js'
import { validateDraft, enabledDomains } from '../src/core/config.js'

test('normalizeDomain handles URLs, www, case and wildcards', () => {
  assert.equal(normalizeDomain('https://www.Facebook.com/feed'), 'facebook.com')
  assert.equal(normalizeDomain('*.old.reddit.com'), 'old.reddit.com')
  assert.equal(normalizeDomain('example.com.'), 'example.com')
  assert.equal(normalizeDomain('not a domain'), null)
  assert.equal(normalizeDomain('localhost'), null)
})

test('covers is label-boundary aware', () => {
  assert.equal(covers('reddit.com', 'old.reddit.com'), true)
  assert.equal(covers('reddit.com', 'notreddit.com'), false)
})

test('parseHosts reads hosts-format lines', () => {
  const domains = parseHosts('# comment\n0.0.0.0 example.com\n0.0.0.0 www.example.org\n0.0.0.0 bad\n')
  assert.deepEqual(domains, ['example.com', 'example.org'])
  assert.equal(parseHostsLine('0.0.0.0 sub.example.net'), 'sub.example.net')
})

test('redirect rules are chunked and target main_frame only', () => {
  const domains = Array.from({ length: 1200 }, (_, i) => `site${i}.test`)
  const rules = buildRedirectRules(domains, 'chrome-extension://abc/blocked.html')
  assert.equal(rules.length, 3)
  assert.equal(rules[0].condition.requestDomains.length, 500)
  assert.deepEqual(rules[0].condition.resourceTypes, ['main_frame'])
  assert.equal(rules[0].priority, 2)
  assert.match(rules[0].action.redirect.regexSubstitution, /blocked\.html#\\0$/)
})

test('block rules use distinct ids and lower priority', () => {
  const rules = buildBlockRules(['a.test', 'b.test'])
  assert.equal(rules.length, 1)
  assert.equal(rules[0].priority, 1)
  assert.equal(rules[0].id, 1)
})

test('config validation requires an enabled built-in list and dedupes domains', () => {
  const bad = validateDraft({ categories: [{ name: 'Only custom', domains: ['x.test'] }] })
  assert.equal(bad.ok, false)

  const good = validateDraft({
    categories: [
      { name: 'Adult', builtin: true, domains: ['www.example.com', 'example.com'] },
      { name: 'Social', domains: ['reddit.com'] },
    ],
  })
  assert.equal(good.ok, true)
  assert.deepEqual(good.config.categories[0].domains, ['example.com'])
  assert.deepEqual(enabledDomains(good.config), ['example.com', 'reddit.com'])
})

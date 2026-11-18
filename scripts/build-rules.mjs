/**
 * Regenerate the static safety-net ruleset from the curated hosts list.
 * Run: node scripts/build-rules.mjs
 *
 * Static `block` rules are priority 1. Dynamic redirect rules (built at
 * install from the same list) are priority 2 and take over when available.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseHosts } from '../src/core/hosts.js'
import { buildBlockRules } from '../src/core/rules.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'data', 'hosts.txt')
const target = path.join(root, 'public', 'rules', 'adult-block.json')

const domains = parseHosts(await readFile(source, 'utf8'))
const rules = buildBlockRules(domains)

await mkdir(path.dirname(target), { recursive: true })
await writeFile(target, JSON.stringify(rules))

console.log(`Wrote ${rules.length} static rules for ${domains.length} domains -> ${target}`)

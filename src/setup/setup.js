import { normalizeDomain } from '../core/domain.js'

const byId = (id) => document.getElementById(id)
let categories = []
let builtin = []

function render() {
  const built = builtin[0]
  byId('builtin').innerHTML = ''
  if (built) {
    const card = document.createElement('div')
    card.className = 'card'
    const row = document.createElement('div')
    row.className = 'row spread'
    const left = document.createElement('div')
    const label = document.createElement('div')
    label.className = 'label'
    label.textContent = built.name
    const note = document.createElement('div')
    note.className = 'muted'
    note.textContent = `${built.domains.length.toLocaleString()} curated domains · always on`
    left.append(label, note)
    const badge = document.createElement('span')
    badge.className = 'badge on'
    badge.textContent = 'BUILT IN'
    row.append(left, badge)
    card.append(row)
    byId('builtin').append(card)
  }

  const list = byId('categories')
  list.replaceChildren()
  for (const [index, category] of categories.entries()) {
    const item = document.createElement('div')
    item.className = 'card category-item'
    const left = document.createElement('div')
    const name = document.createElement('div')
    name.className = 'label'
    name.textContent = category.name
    const count = document.createElement('div')
    count.className = 'muted'
    count.textContent = `${category.domains.length} domain${category.domains.length === 1 ? '' : 's'}`
    left.append(name, count)
    for (const domain of category.domains.slice(0, 8)) {
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.textContent = domain
      left.append(chip)
    }
    if (category.domains.length > 8) {
      const more = document.createElement('span')
      more.className = 'muted'
      more.textContent = ` +${category.domains.length - 8} more`
      left.append(more)
    }
    const remove = document.createElement('button')
    remove.className = 'danger'
    remove.textContent = 'Remove'
    remove.onclick = () => {
      categories.splice(index, 1)
      render()
    }
    item.append(left, remove)
    list.append(item)
  }
  if (categories.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'muted'
    empty.textContent = 'No custom categories yet. The built-in adult list is enough on its own.'
    list.append(empty)
  }
}

function addCategory() {
  const name = byId('new-name').value.trim()
  const domains = new Set()
  for (const raw of byId('new-domains').value.split(/[\s,;]+/)) {
    const domain = normalizeDomain(raw)
    if (domain) domains.add(domain)
  }
  if (!name) return showError('Give the category a name.')
  if (domains.size === 0) return showError('Add at least one valid domain.')
  categories.push({
    id: `custom-${Date.now()}-${categories.length}`,
    name,
    builtin: false,
    enabled: true,
    domains: [...domains].sort(),
  })
  byId('new-name').value = ''
  byId('new-domains').value = ''
  showError('')
  render()
}

function showError(message) {
  byId('error').textContent = message
}

async function lock() {
  byId('lock').disabled = true
  byId('lock-error').textContent = ''
  const draft = { categories: [...builtin, ...categories] }
  try {
    const response = await chrome.runtime.sendMessage({ type: 'lock', draft })
    if (!response?.ok) {
      byId('lock-error').textContent = response?.error ?? 'Could not lock. Try again.'
      byId('lock').disabled = false
      return
    }
    chrome.runtime.openOptionsPage()
    window.close()
  } catch (error) {
    byId('lock-error').textContent = String(error)
    byId('lock').disabled = false
  }
}

byId('add').onclick = addCategory
byId('lock').onclick = lock

const draft = await chrome.runtime.sendMessage({ type: 'draft' })
if (draft?.locked) {
  chrome.runtime.openOptionsPage()
  window.close()
} else {
  builtin = draft?.categories?.filter((category) => category.builtin) ?? []
  categories = draft?.categories?.filter((category) => !category.builtin) ?? []
  render()
}

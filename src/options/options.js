const content = document.getElementById('content')
const status = await chrome.runtime.sendMessage({ type: 'status' })

if (!status?.locked) {
  content.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'card'
  const title = document.createElement('div')
  title.className = 'label'
  title.textContent = 'Finish one-time setup'
  const note = document.createElement('p')
  note.textContent = 'Choose your categories and lock Focus before protection starts.'
  const button = document.createElement('button')
  button.className = 'primary'
  button.textContent = 'Open setup'
  button.onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL('src/setup/setup.html') })
  card.append(title, note, button)
  content.append(card)
} else {
  content.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'card'
  const row = document.createElement('div')
  row.className = 'row spread'
  const label = document.createElement('div')
  label.className = 'label'
  label.textContent = 'Protection is locked'
  const badge = document.createElement('span')
  badge.className = 'badge locked'
  badge.textContent = 'HARD LOCK'
  row.append(label, badge)
  const note = document.createElement('p')
  note.textContent = 'Categories, lists and the on/off state cannot be changed from inside the browser. Uninstalling and reinstalling Focus resets it to first-run setup with protection on by default.'
  const list = document.createElement('div')
  list.className = 'category-list'
  for (const category of status.categories) {
    const item = document.createElement('div')
    item.className = 'row spread'
    const name = document.createElement('span')
    name.textContent = category.name
    const count = document.createElement('span')
    count.className = 'muted'
    count.textContent = `${category.domainCount.toLocaleString()} domains`
    item.append(name, count)
    list.append(item)
  }
  card.append(row, note, list)
  content.append(card)
}

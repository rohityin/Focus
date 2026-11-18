const byId = (id) => document.getElementById(id)

const status = await chrome.runtime.sendMessage({ type: 'status' })

if (!status?.locked) {
  byId('dot').classList.add('off')
  byId('headline').textContent = 'Setup not finished.'
  const open = document.createElement('button')
  open.className = 'primary'
  open.textContent = 'Finish setup'
  open.onclick = () => chrome.runtime.openOptionsPage()
  document.getElementById('categories').append(open)
} else {
  byId('headline').textContent = 'Protection is on and locked.'
  byId('count').textContent = (status.blockedCount ?? 0).toLocaleString()
  const list = byId('categories')
  list.replaceChildren()
  for (const category of status.categories) {
    const row = document.createElement('div')
    row.className = 'row spread'
    const name = document.createElement('span')
    name.textContent = category.name
    const badge = document.createElement('span')
    badge.className = 'badge on'
    badge.textContent = `${category.domainCount.toLocaleString()} sites`
    row.append(name, badge)
    list.append(row)
  }
}

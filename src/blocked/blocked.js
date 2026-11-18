/**
 * The block page runs on the extension origin and anyone can link to it with
 * an arbitrary fragment. Treat it as hostile input: parse through URL, accept
 * only http(s), ask the background whether the host is actually blocked, and
 * write through textContent only — never innerHTML.
 */
const site = document.getElementById('site')
const reason = document.getElementById('reason')

let original = null
try {
  const candidate = new URL(decodeURIComponent(location.hash.slice(1)))
  if (candidate.protocol === 'http:' || candidate.protocol === 'https:') original = candidate
} catch {
  // No usable URL in the fragment.
}

if (!original) {
  site.textContent = ''
} else {
  let response
  try {
    response = await chrome.runtime.sendMessage({ type: 'blocked', url: original.href })
  } catch {
    response = null
  }
  if (response?.known) {
    site.textContent = original.hostname
  } else {
    // Never echo a host the user never blocked.
    site.textContent = ''
    reason.textContent = 'Focus stopped this navigation before the page loaded.'
  }
}

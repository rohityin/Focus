/** The only module that touches chrome.storage for the config. */
import { STORAGE_KEY, defaultConfig } from './config.js'

export async function readConfig() {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  return stored[STORAGE_KEY] ?? defaultConfig()
}

/** Single writer. Setup is the only caller that is allowed to lock. */
export async function writeConfig(config) {
  await chrome.storage.local.set({ [STORAGE_KEY]: config })
}

export function onConfigChanged(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) callback(changes[STORAGE_KEY])
  })
}

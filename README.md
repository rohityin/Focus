# Focus — NSFW Blocker

A Manifest V3 Chrome extension that blocks adult sites plus any custom categories you add, with a hard lock so it cannot be casually switched off.

- Curated blocklist of ~58,000 domains, adapted from [codepurse/BlockNSFW](https://github.com/codepurse/BlockNSFW) (MIT)
- DNR engine and domain handling adapted from [devpeer-net/website-blocker](https://github.com/devpeer-net/website-blocker) (MIT)
- No network requests, no telemetry, no account — see [docs/RESEARCH.md](docs/RESEARCH.md) for the full comparison

## Install

```bash
npm run build   # regenerates public/rules/adult-block.json from data/hosts.txt
```

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. **Load unpacked** → select this folder.
4. Click **Finish setup** in the popup (or the gear icon). The NSFW list is already preconfigured — just click **Lock & enable**. You can also add your own domains manually if you want, but nothing else is blocked by default.

After locking, there are no editable settings by design. To reset, uninstall and reinstall.

Two settings to change right after install:

- **Allow in Incognito**
- **Site access: On all sites**

See [docs/HARDENING.md](docs/HARDENING.md) for why these matter and for the enterprise-policy option if you need a true hard lock.

## How it works

```
setup page ──writes once──> chrome.storage.local (locked)
                                  │ onChanged / startup / 1-minute alarm
                                  ▼
                       service worker ──> declarativeNetRequest dynamic rules
                                  ▼
             navigation to a blocked site ──> blocked.html#<original url>
```

Two layers of protection:

1. A **static DNR ruleset** (`public/rules/adult-block.json`) with priority-1 `block` rules works immediately at install, even before the worker runs.
2. **Dynamic priority-2 redirect rules** send blocked navigations to the local block page. A one-minute alarm re-applies them if anything clears them.

Rules use `requestDomains` (500 per rule, so subdomains are covered) and `resourceTypes: ['main_frame']`. Open tabs on a newly blocked site are redirected too.

The block page treats its URL fragment as hostile input: it parses through `URL`, accepts only `http(s)`, asks the background whether that host is really blocked, and writes with `textContent` only. It has no continue link.

## Limitations

- An extension cannot stop you disabling or removing it at `chrome://extensions`. The lock stops reflex bypasses, not deliberate tampering.
- Only top-level navigations are blocked; embedded frames are not.
- Back/forward-cache pages that issue no request may not be caught.
- The curated list covers known domains, not arbitrary new ones. There is no content scanning or AI classification.
- Uninstalling and reinstalling resets everything to first-run setup with the built-in list on.

## Development

```bash
npm test    # pure-logic tests with node:test
npm run build
```

Project layout:

| Path | Purpose |
|---|---|
| `data/hosts.txt` | Curated source list (MIT, from BlockNSFW) |
| `scripts/build-rules.mjs` | Generates the static DNR ruleset |
| `src/core/` | Pure logic: domains, hosts parsing, rules, config |
| `src/background/` | MV3 service worker: rule sync, self-heal, messages |
| `src/setup/` | One-time setup wizard |
| `src/popup/` | Read-only status |
| `src/options/` | Locked-state explanation |
| `src/blocked/` | Block page |

## License

MIT. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for adapted code and data.

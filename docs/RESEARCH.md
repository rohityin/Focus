# Research: existing open-source approaches

Reviewed on 2026-11-18 against the GitHub API. The engine and the data were
chosen from existing MIT-licensed work rather than written from scratch.

| Project | Engine | Domain data | Anti-bypass design | What we took |
|---|---|---|---|---|
| `codepurse/BlockNSFW` (58★, MIT, v2.0.8) | Static DNR ruleset (~91k domains, 4.8 MB) + content script, on-device AI image/text filters, SafeSearch, DNS, subscriptions | Self-hosted, MIT-curated `HOSTS.txt` | PIN + "Pact": weakening changes queue with a 15 min / 1 h / 1 d / 3 d delay; server clock prevents changing the system time; optional witness TOTP | The `HOSTS.txt` dataset, and the insight that a self-set PIN cannot stop a determined user |
| `devpeer-net/website-blocker` (MIT, TS/React) | DNR dynamic rules, 500 domains/rule, priority-2 redirect + priority-1 block fallback, `main_frame`, `storage.onChanged → syncRules` | None (self-managed) | Confirmation dialog + cited tips | Engine architecture, domain canonicalisation, chunking, open-tab sweep, hostile-input handling of the block page |
| `MohamedBen21/FocusGuard` (MIT) | `webNavigation.onBeforeNavigate` + salted SHA-256 hash set | 1,678 hidden hashed domains | Simple on/off toggle | Not adopted: async tab redirect is racy, and the opaque list needs a private generator to maintain |
| `Timothy1102/focus-blocker` (MIT) | One DNR redirect rule per enabled site | None | Explicitly not a lock | Confirms `<all_urls>` host access is required for redirect rules |
| `Sam-Wo/blocker-extension` | DNR dynamic rules | None | None | One-minute alarm to re-apply rules if cleared |

## Decisions

1. **Engine:** devpeer's storage → `syncRules()` pipeline with chunked
   `requestDomains`, a priority-2 `redirect` rule using
   `regexSubstitution: <blocked.html>#\\0`, and a priority-1 static `block`
   safety net. `resourceTypes: ['main_frame']` is explicit — Chrome's default
   excludes main frames.
2. **Data:** BlockNSFW's MIT-licensed curated list, converted by a build
   script instead of hand-written.
3. **Lock:** hard lock as requested — one setup, no editable settings,
   `storage.local` only (no sync), reinstall to reset.
4. **Rejected for v1:** hashed domain lists (unmaintainable), AI image
   classification (heavy, needs network for one model), DNS and SafeSearch
   features (out of scope), and the Pact (conflicts with the chosen hard lock).
   The Pact is worth reconsidering later: a delay is harder to bypass than a
   password, because the user knows the password.

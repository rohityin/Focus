# Third-party notices

## Curated adult domain list

`data/hosts.txt` is derived from the `HOSTS.txt` file in
[codepurse/BlockNSFW](https://github.com/codepurse/BlockNSFW), which is
licensed under the MIT License. A copy of that license is in
`THIRD_PARTY_LICENSE_BlockNSFW.txt`.

The list is used unchanged as a data source. `scripts/build-rules.mjs`
converts it into the static safety-net ruleset in `public/rules/`, and the
service worker parses the same file at install time to build the redirect
rules. No domain names are invented by this project.

## Patterns adapted from open-source projects

- The `src/core/domain.js` canonicalisation and the
  `redirect` + lower-priority `block` rule design in `src/core/rules.js`
  follow [devpeer-net/website-blocker](https://github.com/devpeer-net/website-blocker)
  (MIT).
- The one-minute self-heal alarm in `src/background/service-worker.js`
  follows [Sam-Wo/blocker-extension](https://github.com/Sam-Wo/blocker-extension).
- The "queued weakening change" idea documented in `docs/RESEARCH.md`
  comes from [codepurse/BlockNSFW](https://github.com/codepurse/BlockNSFW)'s
  Pact implementation.

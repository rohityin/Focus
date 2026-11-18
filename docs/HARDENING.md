# Hard-lock reality check

The extension locks its own settings, but **no Chrome extension can prevent a
user from disabling or removing it at `chrome://extensions`** — Chrome does
not expose that control to extensions. The lock stops reflex bypasses: there
is no toggle, no whitelist, no pause, and no continue link on the block page.
It does not stop someone who deliberately opens the browser's extension
manager.

For an actual hard lock on a Windows machine, enforce it with Chrome enterprise
policy rather than extension code:

1. Set `ExtensionInstallForcelist` to this extension's Web Store ID (or a CRX
   URL). A force-installed extension cannot be uninstalled from the UI.
2. Optionally set `ExtensionInstallBlocklist` to `*` to block other
   extensions, and lock access to `chrome://extensions` with a policy or a
   supervised profile.
3. On Windows these are registry values under
   `HKLM\SOFTWARE\Policies\Google\Chrome` (or `HKCU` for a single user). Reload
   policy at `chrome://policy`.

Other settings worth changing immediately, even without enterprise policy:

- **Allow in Incognito** — otherwise an incognito window bypasses everything.
- **Site access: On all sites** — with narrower access, the static block
  rules still stop navigation but the custom block page will not appear.
- Use a separate Chrome profile if other people share the machine.

Uninstalling and reinstalling resets `chrome.storage.local`, which returns the
extension to one-time setup with the built-in list enabled. That is the only
reset path by design.

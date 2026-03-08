---
summary: "CLI reference for `qcortex browser` (profiles, tabs, actions, extension relay)"
read_when:
  - You use `qcortex browser` and want examples for common tasks
  - You want to control a browser running on another machine via a node host
  - You want to use the Chrome extension relay (attach/detach via toolbar button)
title: "browser"
---

# `qcortex browser`

Manage QCortex’s browser control server and run browser actions (tabs, snapshots, screenshots, navigation, clicks, typing).

Related:

- Browser tool + API: [Browser tool](/tools/browser)
- Chrome extension relay: [Chrome extension](/tools/chrome-extension)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (defaults to config).
- `--token <token>`: Gateway token (if required).
- `--timeout <ms>`: request timeout (ms).
- `--browser-profile <name>`: choose a browser profile (default from config).
- `--json`: machine-readable output (where supported).

## Quick start (local)

```bash
qcortex browser --browser-profile chrome tabs
qcortex browser --browser-profile qcortex start
qcortex browser --browser-profile qcortex open https://example.com
qcortex browser --browser-profile qcortex snapshot
```

## Profiles

Profiles are named browser routing configs. In practice:

- `qcortex`: launches/attaches to a dedicated QCortex-managed Chrome instance (isolated user data dir).
- `chrome`: controls your existing Chrome tab(s) via the Chrome extension relay.

```bash
qcortex browser profiles
qcortex browser create-profile --name work --color "#FF5A36"
qcortex browser delete-profile --name work
```

Use a specific profile:

```bash
qcortex browser --browser-profile work tabs
```

## Tabs

```bash
qcortex browser tabs
qcortex browser open https://docs.qcortex.ai
qcortex browser focus <targetId>
qcortex browser close <targetId>
```

## Snapshot / screenshot / actions

Snapshot:

```bash
qcortex browser snapshot
```

Screenshot:

```bash
qcortex browser screenshot
```

Navigate/click/type (ref-based UI automation):

```bash
qcortex browser navigate https://example.com
qcortex browser click <ref>
qcortex browser type <ref> "hello"
```

## Chrome extension relay (attach via toolbar button)

This mode lets the agent control an existing Chrome tab that you attach manually (it does not auto-attach).

Install the unpacked extension to a stable path:

```bash
qcortex browser extension install
qcortex browser extension path
```

Then Chrome → `chrome://extensions` → enable “Developer mode” → “Load unpacked” → select the printed folder.

Full guide: [Chrome extension](/tools/chrome-extension)

## Remote browser control (node host proxy)

If the Gateway runs on a different machine than the browser, run a **node host** on the machine that has Chrome/Brave/Edge/Chromium. The Gateway will proxy browser actions to that node (no separate browser control server required).

Use `gateway.nodes.browser.mode` to control auto-routing and `gateway.nodes.browser.node` to pin a specific node if multiple are connected.

Security + remote setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)

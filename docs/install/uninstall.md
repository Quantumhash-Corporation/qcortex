---
summary: "Uninstall QCortex completely (CLI, service, state, workspace)"
read_when:
  - You want to remove QCortex from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

# Uninstall

Two paths:

- **Easy path** if `qcortex` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
qcortex uninstall
```

Non-interactive (automation / npx):

```bash
qcortex uninstall --all --yes --non-interactive
npx -y qcortex uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
qcortex gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
qcortex gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${QCORTEX_STATE_DIR:-$HOME/.qcortex}"
```

If you set `QCORTEX_CONFIG_PATH` to a custom location outside the state dir, delete that file too.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.qcortex/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g qcortex
pnpm remove -g qcortex
bun remove -g qcortex
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/QCortex.app
```

Notes:

- If you used profiles (`--profile` / `QCORTEX_PROFILE`), repeat step 3 for each state dir (defaults are `~/.qcortex-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `qcortex` is missing.

### macOS (launchd)

Default label is `ai.qcortex.gateway` (or `ai.qcortex.<profile>`; legacy `com.qcortex.*` may still exist):

```bash
launchctl bootout gui/$UID/ai.qcortex.gateway
rm -f ~/Library/LaunchAgents/ai.qcortex.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.qcortex.<profile>`. Remove any legacy `com.qcortex.*` plists if present.

### Linux (systemd user unit)

Default unit name is `qcortex-gateway.service` (or `qcortex-gateway-<profile>.service`):

```bash
systemctl --user disable --now qcortex-gateway.service
rm -f ~/.config/systemd/user/qcortex-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `QCortex Gateway` (or `QCortex Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "QCortex Gateway"
Remove-Item -Force "$env:USERPROFILE\.qcortex\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.qcortex-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://qcortex.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g qcortex@latest`.
Remove it with `npm rm -g qcortex` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `qcortex ...` / `bun run qcortex ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.

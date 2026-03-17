---
summary: "Run QCortex in a rootless Podman container"
read_when:
  - You want a containerized gateway with Podman instead of Docker
title: "Podman"
---

# Podman

Run the QCortex gateway in a **rootless** Podman container. Uses the same image as Docker (build from the repo [Dockerfile](https://github.com/qcortex/qcortex/blob/main/Dockerfile)).

## Requirements

- Podman (rootless)
- Sudo for one-time setup (create user, build image)

## Quick start

**1. One-time setup** (from repo root; creates user, builds image, installs launch script):

```bash
./setup-podman.sh
```

This also creates a minimal `~qcortex/.qcortex/qcortex.json` (sets `gateway.mode="local"`) so the gateway can start without running the wizard.

By default the container is **not** installed as a systemd service, you start it manually (see below). For a production-style setup with auto-start and restarts, install it as a systemd Quadlet user service instead:

```bash
./setup-podman.sh --quadlet
```

(Or set `QCORTEX_PODMAN_QUADLET=1`; use `--container` to install only the container and launch script.)

Optional build-time env vars (set before running `setup-podman.sh`):

- `QCORTEX_DOCKER_APT_PACKAGES` — install extra apt packages during image build
- `QCORTEX_EXTENSIONS` — pre-install extension dependencies (space-separated extension names, e.g. `diagnostics-otel matrix`)

**2. Start gateway** (manual, for quick smoke testing):

```bash
./scripts/run-qcortex-podman.sh launch
```

**3. Onboarding wizard** (e.g. to add channels or providers):

```bash
./scripts/run-qcortex-podman.sh launch setup
```

Then open `http://127.0.0.1:18789/` and use the token from `~qcortex/.qcortex/.env` (or the value printed by setup).

## Systemd (Quadlet, optional)

If you ran `./setup-podman.sh --quadlet` (or `QCORTEX_PODMAN_QUADLET=1`), a [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) unit is installed so the gateway runs as a systemd user service for the qcortex user. The service is enabled and started at the end of setup.

- **Start:** `sudo systemctl --machine qcortex@ --user start qcortex.service`
- **Stop:** `sudo systemctl --machine qcortex@ --user stop qcortex.service`
- **Status:** `sudo systemctl --machine qcortex@ --user status qcortex.service`
- **Logs:** `sudo journalctl --machine qcortex@ --user -u qcortex.service -f`

The quadlet file lives at `~qcortex/.config/containers/systemd/qcortex.container`. To change ports or env, edit that file (or the `.env` it sources), then `sudo systemctl --machine qcortex@ --user daemon-reload` and restart the service. On boot, the service starts automatically if lingering is enabled for qcortex (setup does this when loginctl is available).

To add quadlet **after** an initial setup that did not use it, re-run: `./setup-podman.sh --quadlet`.

## The qcortex user (non-login)

`setup-podman.sh` creates a dedicated system user `qcortex`:

- **Shell:** `nologin` — no interactive login; reduces attack surface.
- **Home:** e.g. `/home/qcortex` — holds `~/.qcortex` (config, workspace) and the launch script `run-qcortex-podman.sh`.
- **Rootless Podman:** The user must have a **subuid** and **subgid** range. Many distros assign these automatically when the user is created. If setup prints a warning, add lines to `/etc/subuid` and `/etc/subgid`:

  ```text
  qcortex:100000:65536
  ```

  Then start the gateway as that user (e.g. from cron or systemd):

  ```bash
  sudo -u qcortex /home/qcortex/run-qcortex-podman.sh
  sudo -u qcortex /home/qcortex/run-qcortex-podman.sh setup
  ```

- **Config:** Only `qcortex` and root can access `/home/qcortex/.qcortex`. To edit config: use the Control UI once the gateway is running, or `sudo -u qcortex $EDITOR /home/qcortex/.qcortex/qcortex.json`.

## Environment and config

- **Token:** Stored in `~qcortex/.qcortex/.env` as `QCORTEX_GATEWAY_TOKEN`. `setup-podman.sh` and `run-qcortex-podman.sh` generate it if missing (uses `openssl`, `python3`, or `od`).
- **Optional:** In that `.env` you can set provider keys (e.g. `GROQ_API_KEY`, `OLLAMA_API_KEY`) and other QCortex env vars.
- **Host ports:** By default the script maps `18789` (gateway) and `18790` (bridge). Override the **host** port mapping with `QCORTEX_PODMAN_GATEWAY_HOST_PORT` and `QCORTEX_PODMAN_BRIDGE_HOST_PORT` when launching.
- **Gateway bind:** By default, `run-qcortex-podman.sh` starts the gateway with `--bind loopback` for safe local access. To expose on LAN, set `QCORTEX_GATEWAY_BIND=lan` and configure `gateway.controlUi.allowedOrigins` (or explicitly enable host-header fallback) in `qcortex.json`.
- **Paths:** Host config and workspace default to `~qcortex/.qcortex` and `~qcortex/.qcortex/workspace`. Override the host paths used by the launch script with `QCORTEX_CONFIG_DIR` and `QCORTEX_WORKSPACE_DIR`.

## Storage model

- **Persistent host data:** `QCORTEX_CONFIG_DIR` and `QCORTEX_WORKSPACE_DIR` are bind-mounted into the container and retain state on the host.
- **Ephemeral sandbox tmpfs:** if you enable `agents.defaults.sandbox`, the tool sandbox containers mount `tmpfs` at `/tmp`, `/var/tmp`, and `/run`. Those paths are memory-backed and disappear with the sandbox container; the top-level Podman container setup does not add its own tmpfs mounts.
- **Disk growth hotspots:** the main paths to watch are `media/`, `agents/<agentId>/sessions/sessions.json`, transcript JSONL files, `cron/runs/*.jsonl`, and rolling file logs under `/tmp/qcortex/` (or your configured `logging.file`).

`setup-podman.sh` now stages the image tar in a private temp directory and prints the chosen base dir during setup. For non-root runs it accepts `TMPDIR` only when that base is safe to use; otherwise it falls back to `/var/tmp`, then `/tmp`. The saved tar stays owner-only and is streamed into the target user’s `podman load`, so private caller temp dirs do not block setup.

## Useful commands

- **Logs:** With quadlet: `sudo journalctl --machine qcortex@ --user -u qcortex.service -f`. With script: `sudo -u qcortex podman logs -f qcortex`
- **Stop:** With quadlet: `sudo systemctl --machine qcortex@ --user stop qcortex.service`. With script: `sudo -u qcortex podman stop qcortex`
- **Start again:** With quadlet: `sudo systemctl --machine qcortex@ --user start qcortex.service`. With script: re-run the launch script or `podman start qcortex`
- **Remove container:** `sudo -u qcortex podman rm -f qcortex` — config and workspace on the host are kept

## Troubleshooting

- **Permission denied (EACCES) on config or auth-profiles:** The container defaults to `--userns=keep-id` and runs as the same uid/gid as the host user running the script. Ensure your host `QCORTEX_CONFIG_DIR` and `QCORTEX_WORKSPACE_DIR` are owned by that user.
- **Gateway start blocked (missing `gateway.mode=local`):** Ensure `~qcortex/.qcortex/qcortex.json` exists and sets `gateway.mode="local"`. `setup-podman.sh` creates this file if missing.
- **Rootless Podman fails for user qcortex:** Check `/etc/subuid` and `/etc/subgid` contain a line for `qcortex` (e.g. `qcortex:100000:65536`). Add it if missing and restart.
- **Container name in use:** The launch script uses `podman run --replace`, so the existing container is replaced when you start again. To clean up manually: `podman rm -f qcortex`.
- **Script not found when running as qcortex:** Ensure `setup-podman.sh` was run so that `run-qcortex-podman.sh` is copied to qcortex’s home (e.g. `/home/qcortex/run-qcortex-podman.sh`).
- **Quadlet service not found or fails to start:** Run `sudo systemctl --machine qcortex@ --user daemon-reload` after editing the `.container` file. Quadlet requires cgroups v2: `podman info --format '{{.Host.CgroupsVersion}}'` should show `2`.

## Optional: run as your own user

To run the gateway as your normal user (no dedicated qcortex user): build the image, create `~/.qcortex/.env` with `QCORTEX_GATEWAY_TOKEN`, and run the container with `--userns=keep-id` and mounts to your `~/.qcortex`. The launch script is designed for the qcortex-user flow; for a single-user setup you can instead run the `podman run` command from the script manually, pointing config and workspace to your home. Recommended for most users: use `setup-podman.sh` and run as the qcortex user so config and process are isolated.

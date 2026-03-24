---
summary: "CLI reference for `qcortex config` (get/set/unset/file/validate)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `qcortex config`

Config helpers: get/set/unset/validate values by path and print the active
config file. Run without a subcommand to open
the configure wizard (same as `qcortex configure`).

## Examples

```bash
qcortex config file
qcortex config get browser.executablePath
qcortex config set browser.executablePath "/usr/bin/google-chrome"
qcortex config set agents.defaults.heartbeat.every "2h"
qcortex config set agents.list[0].tools.exec.node "node-id-or-name"
qcortex config unset tools.web.search.apiKey
qcortex config validate
qcortex config validate --json
```

## Paths

Paths use dot or bracket notation:

```bash
qcortex config get agents.defaults.workspace
qcortex config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
qcortex config get agents.list
qcortex config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--strict-json` to require JSON5 parsing. `--json` remains supported as a legacy alias.

```bash
qcortex config set agents.defaults.heartbeat.every "0m"
qcortex config set gateway.port 19001 --strict-json
qcortex config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcommands

- `config file`: Print the active config file path (resolved from `QCORTEX_CONFIG_PATH` or default location).

Restart the gateway after edits.

## Validate

Validate the current config against the active schema without starting the
gateway.

```bash
qcortex config validate
qcortex config validate --json
```

---
summary: "CLI reference for `qcortex logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `qcortex logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
qcortex logs
qcortex logs --follow
qcortex logs --json
qcortex logs --limit 500
qcortex logs --local-time
qcortex logs --follow --local-time
```

Use `--local-time` to render timestamps in your local timezone.

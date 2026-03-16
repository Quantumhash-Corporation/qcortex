---
summary: "CLI reference for `qcortex reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `qcortex reset`

Reset local config/state (keeps the CLI installed).

```bash
qcortex reset
qcortex reset --dry-run
qcortex reset --scope config+creds+sessions --yes --non-interactive
```

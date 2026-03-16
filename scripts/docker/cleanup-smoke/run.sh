#!/usr/bin/env bash
set -euo pipefail

cd /repo

export QCORTEX_STATE_DIR="/tmp/qcortex-test"
export QCORTEX_CONFIG_PATH="${QCORTEX_STATE_DIR}/qcortex.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${QCORTEX_STATE_DIR}/credentials"
mkdir -p "${QCORTEX_STATE_DIR}/agents/main/sessions"
echo '{}' >"${QCORTEX_CONFIG_PATH}"
echo 'creds' >"${QCORTEX_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${QCORTEX_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm qcortex reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${QCORTEX_CONFIG_PATH}"
test ! -d "${QCORTEX_STATE_DIR}/credentials"
test ! -d "${QCORTEX_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${QCORTEX_STATE_DIR}/credentials"
echo '{}' >"${QCORTEX_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm qcortex uninstall --state --yes --non-interactive

test ! -d "${QCORTEX_STATE_DIR}"

echo "OK"

#!/usr/bin/env bash
set -euo pipefail
echo "🦞 QCortex Setup"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. pnpm install & build
pnpm install && pnpm build

# 2. qcortex command globally available karo
mkdir -p ~/.local/bin
cat > ~/.local/bin/qcortex << WRAPPER
#!/usr/bin/env bash
set -euo pipefail
exec node "${SCRIPT_DIR}/dist/entry.js" "\$@"
WRAPPER
chmod +x ~/.local/bin/qcortex

# 3. PATH mein add karo
if ! grep -q '.local/bin' ~/.zshrc 2>/dev/null; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
fi
if ! grep -q '.local/bin' ~/.bashrc 2>/dev/null; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi
export PATH="$HOME/.local/bin:$PATH"

echo "✅ qcortex command ready!"
echo ""

# 4. Onboard
exec qcortex onboard --install-daemon

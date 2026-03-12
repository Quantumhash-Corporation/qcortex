#!/usr/bin/env bash
set -euo pipefail
echo "🧠 QCortex Setup"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. pnpm install & build
pnpm install && pnpm build

# 2. qcortex wrapper banao
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
echo "⚠️  New terminal mein PATH auto-apply hoga."
echo "   Is session mein use karne ke liye:"
echo "   source ~/.zshrc  (zsh)"
echo "   source ~/.bashrc (bash)"
echo ""

# 4. Verify
if ! command -v qcortex &>/dev/null; then
  echo "❌ qcortex command not found — manually run: export PATH=\"\$HOME/.local/bin:\$PATH\""
  exit 1
fi

echo "🚀 Starting onboard..."
exec qcortex onboard --install-daemon

# Already handled above, but tell user clearly
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "👉 Run this to start:"
echo "   source ~/.zshrc && qcortex onboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

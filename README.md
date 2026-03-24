# QCortex — Personal AI Assistant

<p align="center">
  <a href="https://github.com/qcortex/qcortex/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/qcortex/qcortex/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://github.com/qcortex/qcortex/releases"><img src="https://img.shields.io/github/v/release/qcortex/qcortex?include_prereleases&style=for-the-badge" alt="GitHub release"></a>
  <a href="https://discord.gg/clawd"><img src="https://img.shields.io/discord/1456350064065904867?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

**QCortex** is a personal AI assistant you run on your own devices. It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, BlueBubbles, IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WebChat). It can speak and listen on macOS/iOS/Android, and can render a live Canvas you control.

If you want a personal, single-user assistant that feels local, fast, and always-on, this is it.

## Quick Start

```bash
# Install globally
npm install -g qcortex

# Or with pnpm
pnpm add -g qcortex

# Run onboarding wizard
qcortex onboard

# Or quick setup
qcortex setup
```

The wizard guides you step by step through setting up the gateway, workspace, channels, and skills. Works on macOS, Linux, and Windows (WSL2 recommended).

## Supported Channels

| Channel         | Status | Notes                   |
| --------------- | ------ | ----------------------- |
| WhatsApp        | ✅     | Web session via Baileys |
| Telegram        | ✅     | Bot API + private chats |
| Discord         | ✅     | Server + DMs + threads  |
| Slack           | ✅     | Workspace integration   |
| Signal          | ✅     | Signal Messenger        |
| iMessage        | ✅     | Via BlueBubbles         |
| LINE            | ✅     | LINE Messaging API      |
| Microsoft Teams | ✅     | Teams integration       |
| Matrix          | ✅     | Matrix protocol         |
| Google Chat     | ✅     | Google Workspace        |
| Feishu/Lark     | ✅     | Feishu open platform    |
| Nextcloud Talk  | ✅     | Nextcloud               |
| IRC             | ✅     | Legacy IRC              |
| Nostr           | ✅     | Decentralized           |
| Twitch          | ✅     | Twitch chat             |
| And more        | ✅     | See docs                |

## CLI Commands

### Core Commands

| Command             | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `qcortex setup`     | Initialize local config and agent workspace                 |
| `qcortex configure` | Interactive setup wizard for credentials, channels, gateway |
| `qcortex onboard`   | Full onboarding wizard                                      |
| `qcortex doctor`    | Health checks + quick fixes                                 |
| `qcortex gateway`   | Run the WebSocket Gateway                                   |
| `qcortex status`    | Show channel health                                         |

### Channel Management

```bash
# List configured channels
qcortex channels list

# Add a channel
qcortex channels add --channel telegram --token YOUR_TOKEN

# Link/login a channel
qcortex channels login --channel whatsapp

# Check status
qcortex channels status
```

### Agent Management

```bash
# List agents
qcortex agents list

# Add agent
qcortex agents add my-agent

# Agent bindings
qcortex agents bindings my-agent
```

### Messaging

```bash
# Send message
qcortex message send --channel telegram --target @username --message "Hello!"

# Read messages
qcortex message read --channel whatsapp --target +15551234567

# List messages
qcortex message list --channel discord
```

### Configuration

```bash
# Get config
qcortex config get gateway.port

# Set config
qcortex config set gateway.port 8080

# Config file
qcortex config file

# Validate
qcortex config validate
```

### Models

```bash
# List models
qcortex models list

# Scan local models
qcortex models scan

# Set default
qcortex models default --provider openai --model gpt-4
```

### Plugins

```bash
# List plugins
qcortex plugins list

# Install plugin
qcortex plugins install @qcortex/plugin-name

# Update plugins
qcortex plugins update
```

### Memory

```bash
# Search memory
qcortex memory search "what was discussed"

# Reindex
qcortex memory reindex
```

### Logs & Debugging

```bash
# Tail logs
qcortex logs

# With filter
qcortex logs --filter error
```

### Other Commands

```bash
# Terminal UI
qcortex tui

# Open dashboard
qcortex dashboard

# System info
qcortex system info

# Device pairing
qcortex devices list
```

## Configuration

Config stored at `~/.qcortex/config.json`:

```json
{
  "gateway": {
    "port": 18789,
    "auth": {
      "token": "your-token"
    }
  },
  "channels": {
    "telegram": {
      "token": "bot-token"
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-4"
    }
  }
}
```

### Environment Variables

- `QCORTEX_CONFIG_PATH` - Custom config file
- `QCORTEX_STATE_DIR` - Custom state directory
- `QCORTEX_PROFILE` - Named profile (isolated config)

## Plugin SDK

Extend QCortex with plugins:

```typescript
import { definePlugin, type PluginContext } from "qcortex/plugin-sdk";

export default definePlugin({
  name: "my-plugin",
  setup(ctx: PluginContext) {
    // Register hooks, tools, handlers
  },
});
```

### Available Exports

```typescript
// Main SDK
import { definePlugin, type PluginContext } from "qcortex/plugin-sdk";

// Channel helpers
import { telegram } from "qcortex/plugin-sdk/telegram";
import { discord } from "qcortex/plugin-sdk/discord";
import { slack } from "qcortex/plugin-sdk/slack";
// ... and more
```

## Models & Providers

Supports 50+ providers including:

- **OpenAI** - GPT-4, GPT-4o, o1, o3-mini
- **Anthropic** - Claude 3.5, Claude 3.7
- **Google** - Gemini 2.0
- **xAI** - Grok
- **Ollama** - Local models
- **OpenRouter** - Unified API
- **Azure OpenAI**
- **AWS Bedrock**
- **And 40+ more...**

Configure via `qcortex configure` or directly in config:

```json
{
  "models": {
    "providers": {
      "openai": {
        "apiKey": "sk-..."
      }
    }
  }
}
```

## Gateway

The Gateway is the control plane that connects your channels to AI:

```bash
# Run gateway
qcortex gateway

# Custom port
qcortex gateway --port 8080

# Force kill existing
qcortex gateway --force

# Dev mode (isolated)
qcortex --dev gateway
```

### Gateway Authentication

Set up authentication:

```bash
# Set token
qcortex config set gateway.auth.token YOUR_TOKEN

# Or password
qcortex config set gateway.auth.password YOUR_PASSWORD

# Set mode explicitly
qcortex config set gateway.auth.mode token
```

## Development

```bash
# Clone
git clone https://github.com/Quantumhash-Corporation/qcortex.git
cd qcortex

# Install
pnpm install

# Build
pnpm build

# Run dev
pnpm dev

# Tests
pnpm test
```

## Documentation

Full documentation available at: **https://docs.qcortex.ai**

## Support

- GitHub Issues: https://github.com/Quantumhash-Corporation/qcortex/issues
- Discord: https://discord.gg/clawd

## License

MIT

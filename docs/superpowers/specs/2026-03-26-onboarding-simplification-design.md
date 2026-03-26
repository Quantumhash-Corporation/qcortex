# Design: Simplified Onboarding for Non-Technical Users

**Date:** 2026-03-26
**Status:** Approved

## Goal

Simplify QCortex onboarding so any non-technical person can understand how to install and use it.

## Scope

1. Simplify install script output
2. Restructure wizard into "use case" stories
3. Add progressive disclosure (Simple vs Advanced modes)
4. Replace jargon with plain language
5. Improve inline help text

---

## 1. Simplified Install Script

**File:** `public/install.sh` (and `public/install.ps1`)

### Changes

- **Welcome message:** Show friendly intro explaining what QCortex is in 1-2 sentences
- **Progress indicators:** Use plain English ("Setting up your personal AI...")
- **Success output:** Show exactly 3 numbered next steps (not a list of commands)
- **Error handling:** Show simple fix or "Run `qcortex help` for support"

### Example output

```bash
$ curl -fsSL https://qcortex.ai/install.sh | bash

🚀 Setting up your personal AI assistant...

   This takes about 2 minutes.

✓ Installed QCortex
✓ Created your workspace
✓ Ready to configure

   Next step: Run `qcortex setup` to connect your chat apps
```

---

## 2. Wizard Restructured as "Stories" (Use Cases)

**File:** `src/wizard/` (wizard implementation)

### Current flow (7 steps)

Model/Auth → Workspace → Gateway → Channels → Daemon → Health → Skills

### New flow

```
┌─────────────────────────────────────────────────────────┐
│  Welcome! Let's set up your AI assistant                │
│                                                         │
│  What would you like to do?                             │
│                                                         │
│  [1] Chat with me on WhatsApp                           │
│  [2] Chat with me on Telegram                           │
│  [3] Chat with me on Discord                            │
│  [4] Just try it out in my browser (no messaging yet)   │
│                                                         │
│  You can always add more channels later.                │
└─────────────────────────────────────────────────────────┘
```

When user picks an option:

- Automatically configures everything needed for that channel
- Asks only essential questions (e.g., phone number for WhatsApp verification)
- Handles login/auth flow with clear instructions

---

## 3. Progressive Disclosure (Simple vs Advanced)

### Simple mode (default)

- 3-5 questions max
- Plain English, no jargon
- Sensible defaults shown, not technical options

### Advanced mode

- Available via "Show all options" link
- Full control over gateway, daemon, Tailscale, etc.
- Same as current wizard

---

## 4. Jargon Replacement Table

| Jargon       | Plain Language                                                |
| ------------ | ------------------------------------------------------------- |
| "Gateway"    | "The service that connects your AI to messaging apps"         |
| "Daemon"     | "Run in background so it works even after you close terminal" |
| "Workspace"  | "Where your AI's files and memories are stored"               |
| "Tailscale"  | "Access from other devices (like your phone)"                 |
| "Token auth" | "A password to keep your AI secure"                           |

---

## 5. Example Wizard Step (Model Selection)

```
┌─────────────────────────────────────────────────────────┐
│  Choose your AI brain                                   │
│                                                         │
│  This decides how smart and fast your assistant is.    │
│  Most people use Claude, GPT-4, or Gemini.             │
│                                                         │
│  [1] Claude (Anthropic) - Recommended                   │
│  [2] GPT (OpenAI)                                       │
│  [3] Gemini (Google)                                    │
│  [4] Something else                                    │
│                                                         │
│  ℹ  Need help choosing? Claude is great for coding,   │
│     GPT is most widely used, Gemini offers good value  │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

- Changes affect: install scripts, wizard CLI, onboarding docs
- Maintain backward compatibility with `--advanced` and existing flags
- Test with non-technical users to validate comprehension
- Consider A/B testing different wording approaches

# Onboarding Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify QCortex onboarding so non-technical users can understand how to install and use it

**Architecture:**
- Add "use case" selection at wizard start (WhatsApp, Telegram, Discord, Browser-only)
- Group related questions into conversational flows
- Replace jargon with plain language in all prompts
- Add helpful tips/hints to each step

**Tech Stack:** TypeScript, @clack/prompts, wizard subsystem

---

## File Structure

- `src/wizard/onboarding.ts` - Main wizard orchestrator (add use case selection)
- `src/wizard/prompts.ts` - Prompt types (add hint/help types)
- `src/commands/onboard-helpers.ts` - Wizard helper functions (simplify output)
- `src/commands/onboard-channels.ts` - Channel setup (simplify flow)
- `src/commands/auth-choice-prompt.ts` - Auth prompts (simpler language)
- `docs/start/getting-started.md` - Update docs
- `docs/start/wizard.md` - Update wizard docs

---

## Task 1: Add Use Case Selection at Wizard Start

**Files:**
- Modify: `src/wizard/onboarding.ts:126-143`
- Test: Run `pnpm qcortex onboard` and verify prompt appears

- [ ] **Step 1: Add use case selection after flow prompt**

Replace the flow selection prompt (lines 126-143) with a new use case selection:

```typescript
// After flow selection, add use case selection
const useCase = await prompter.select({
  message: "What would you like to do?",
  options: [
    { value: "whatsapp", label: "Chat with me on WhatsApp" },
    { value: "telegram", label: "Chat with me on Telegram" },
    { value: "discord", label: "Chat with me on Discord" },
    { value: "browser", label: "Just try it out in my browser" },
  ],
  hint: "You can always add more channels later",
});
```

- [ ] **Step 2: Add channel auto-selection based on use case**

Add logic to auto-select channel based on use case:

```typescript
const channelFromUseCase: Record<string, string[]> = {
  whatsapp: ["whatsapp"],
  telegram: ["telegram"],
  discord: ["discord"],
  browser: [],
};

// In setupChannels call, pre-fill based on use case
const forceAllowFromChannels = flow === "quickstart"
  ? channelFromUseCase[useCase] || quickstartAllowFromChannels
  : [];
```

- [ ] **Step 3: Test the flow**

Run: `pnpm qcortex onboard --flow quickstart`
Verify: Use case selection appears after "Onboarding mode"

- [ ] **Step 4: Commit**

```bash
git add src/wizard/onboarding.ts
git commit -m "feat: add use case selection to onboarding wizard"
```

---

## Task 2: Replace Jargon with Plain Language

**Files:**
- Modify: `src/wizard/onboarding.ts:234-263` (quickstart display)
- Modify: `src/commands/onboard-helpers.ts` (various prompts)
- Modify: `src/commands/onboard-channels.ts` (channel prompts)
- Test: Verify prompts show plain language

- [ ] **Step 1: Update quickstart display text**

Replace technical terms in quickstart note (lines 264-283):

```typescript
// Replace "Gateway port" with "Service port"
// Replace "Gateway bind" with "Network access"
// Replace "Gateway auth" with "Security"
// Replace "Tailscale exposure" with "Access from other devices"
```

- [ ] **Step 2: Update workspace prompt**

In `onboard-helpers.ts`, replace "Workspace directory" prompt with:

```typescript
message: "Where should I save your AI's files and memories?",
initialValue: baseConfig.agents?.defaults?.workspace ?? onboardHelpers.DEFAULT_WORKSPACE,
hint: "A folder where your AI stores conversations and settings",
```

- [ ] **Step 3: Update daemon prompt (in gateway config)**

In `onboarding.gateway-config.ts`, replace "Daemon" with:

```typescript
label: "Run in background",
hint: "Keeps your AI running even after you close the terminal",
```

- [ ] **Step 4: Commit**

```bash
git add src/wizard/onboarding.ts src/commands/onboard-helpers.ts src/commands/onboard-channels.ts
git commit -m "feat: replace jargon with plain language in wizard prompts"
```

---

## Task 3: Add Helpful Hints to Each Step

**Files:**
- Modify: `src/wizard/prompts.ts` (add hint type)
- Modify: `src/wizard/clack-prompter.ts` (render hints)
- Modify: Various onboard commands (add hints to prompts)
- Test: Run wizard and verify hints appear

- [ ] **Step 1: Update WizardSelectOption to support hint text**

In `prompts.ts`, the type already has `hint?: string`. Verify it's being used.

- [ ] **Step 2: Add hints to auth choice prompt**

In `auth-choice-prompt.ts`, add hints:

```typescript
options: [
  { value: "apiKey", label: "Claude (Anthropic)", hint: "Recommended - great for coding" },
  { value: "openai-api-key", label: "GPT (OpenAI)", hint: "Most widely used AI" },
  { value: "google-genai", label: "Gemini (Google)", hint: "Good value, fast responses" },
  { value: "skip", label: "I'll set it up later" },
],
```

- [ ] **Step 3: Add hints to channel selection**

In `onboard-channels.ts`, add hints to channel options:

```typescript
{ value: "whatsapp", label: "WhatsApp", hint: "Most popular messaging app" },
{ value: "telegram", label: "Telegram", hint: "Fast, feature-rich" },
{ value: "discord", label: "Discord", hint: "Great for communities" },
```

- [ ] **Step 4: Commit**

```bash
git add src/wizard/prompts.ts src/commands/auth-choice-prompt.ts src/commands/onboard-channels.ts
git commit -m "feat: add helpful hints to wizard prompts"
```

---

## Task 4: Progressive Disclosure (Simple/Advanced)

**Files:**
- Modify: `src/wizard/onboarding.ts:126-143` (flow selection)
- Modify: `src/commands/onboard-helpers.ts` (QuickStart vs Manual hints)
- Test: Verify Simple mode shows fewer questions

- [ ] **Step 1: Improve QuickStart vs Manual prompt**

Make QuickStart the clear default with friendly description:

```typescript
options: [
  {
    value: "quickstart",
    label: "Quick Setup (recommended)",
    hint: "I'll ask a few simple questions, then you're ready to chat",
  },
  {
    value: "advanced",
    label: "Show all options",
    hint: "Full control over every setting",
  },
],
```

- [ ] **Step 2: In advanced mode, add "back to simple" option**

At the start of advanced flow, show a note:

```typescript
if (flow === "advanced") {
  await prompter.note(
    "You're in full control mode. If it gets overwhelming, you can restart and choose Quick Setup.",
    "Tip",
  );
}
```

- [ ] **Step 3: Test both modes**

Run QuickStart: `pnpm qcortex onboard --flow quickstart`
Run Advanced: `pnpm qcortex onboard --flow advanced`

Verify: QuickStart shows fewer prompts, Advanced shows all options

- [ ] **Step 4: Commit**

```bash
git add src/wizard/onboarding.ts
git commit -m "feat: improve Simple vs Advanced mode UX"
```

---

## Task 5: Update Documentation

**Files:**
- Modify: `docs/start/getting-started.md`
- Modify: `docs/start/wizard.md`
- Test: Verify docs match new flow

- [ ] **Step 1: Update getting-started.md**

Update the "Quick setup (CLI)" section to reflect simpler flow:

```markdown
## Quick setup (CLI)

<Steps>
  <Step title="Install QCortex">
    macOS/Linux:
    ```bash
    curl -fsSL https://qcortex.ai/install.sh | bash
    ```
  </Step>
  <Step title="Run setup">
    ```bash
    qcortex onboard
    ```
    The wizard will guide you through a few simple questions:
    - What do you want to do? (chat app or browser)
    - Which AI brain? (Claude, GPT, Gemini)
    - Your phone number (for verification)
  </Step>
  <Step title="Start chatting">
    Run `qcortex dashboard` to open the Control UI
  </Step>
</Steps>
```

- [ ] **Step 2: Update wizard.md**

Add section about Simple vs Advanced modes:

```markdown
## Simple vs Advanced

The wizard offers two modes:

**QuickStart (recommended):**
- Asks just 3-5 questions
- Uses simple language
- Pre-configures sensible defaults

**Advanced:**
- Shows all options
- Full control over gateway, daemon, Tailscale, etc.
- Good for developers or power users
```

- [ ] **Step 3: Commit**

```bash
git add docs/start/getting-started.md docs/start/wizard.md
git commit -m "docs: update onboarding docs for simplified flow"
```

---

## Task 6: Test with Non-Technical User

**Files:**
- Test: Manual testing
- Feedback: Collect user feedback

- [ ] **Step 1: Run through the complete flow**

Execute: `pnpm qcortex onboard --flow quickstart`
Walk through as a new user would

- [ ] **Step 2: Verify all changes work together**

- [ ] **Step 3: Commit any final fixes**

---

## Summary

| Task | Changes |
|------|---------|
| 1. Use case selection | Add WhatsApp/Telegram/Discord/Browser choice at start |
| 2. Plain language | Replace "Gateway", "Daemon", "Workspace" with friendly terms |
| 3. Helpful hints | Add contextual tips to each option |
| 4. Simple/Advanced | Make QuickStart clearly recommended |
| 5. Documentation | Update getting-started and wizard docs |
| 6. Testing | Verify complete flow works |
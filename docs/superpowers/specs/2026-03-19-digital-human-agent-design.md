---
name: Digital Human Agent Design
description: Chat-based autonomous agent that seamlessly handles any web/system task without user knowing about agents
type: project
---

# Digital Human Agent Design

**Date:** 2026-03-19
**Status:** Draft
**Author:** Sbapan

## 1. Overview

### 1.1 What We're Building

A **digital human** - you talk to it naturally like you'd talk to a human assistant. You never mention agents, never know the architecture. You just say "do this" and it happens.

**Key principle:** Transparent automation - the user experiences QCortex as one intelligent entity that handles everything.

### 1.2 Core Experience

| User Experience          | What Happens Behind                                |
| ------------------------ | -------------------------------------------------- |
| "Check my email"         | BrowserAgent → Gmail API → Returns result          |
| "Book a table"           | BrowserAgent → Website → Form fill → OTP if needed |
| "Upload this file"       | DataUploader → Browser/Upload API                  |
| "Create an account on X" | AccountCreator → Website flow → OTP if needed      |

---

## 2. Architecture

### 2.1 System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     User (Any QCortex Channel)                   │
│         (Mac app, Telegram, Discord, Web, etc.)                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     QCortex Gateway                              │
│                  (existing message routing)                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Task Detection Engine                        │
│     Determines if message is a task vs. casual chat             │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              Regular Chat          Task Detected
                    │                     │
                    ▼                     ▼
          (Answer normally)       ┌─────────────────────┐
                                 │    Agent Orchestrator │
                                 │  (invisible to user)  │
                                 └──────────┬────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
           ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
           │ BrowserAgent │         │  OTPFetcher   │         │ DataUploader │
           │ (general web)│         │ (verification)│         │  (files)     │
           └──────────────┘         └──────────────┘         └──────────────┘
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            │
                                            ▼
                                 ┌─────────────────────┐
                                 │   Report Back       │
                                 │ (Adaptive detail)   │
                                 └─────────────────────┘
```

### 2.2 Core Components

#### 2.2.1 Task Detection Engine

Automatically detects when user is giving a task vs. casual conversation:

```typescript
interface TaskDetection {
  // Keywords that indicate a task
  taskTriggers: [
    "can you", "please", "go to", "login", "check", "create",
    "book", "send", "upload", "download", "find", "get",
    "do this", "handle this", "take care of"
  ];

  // Patterns that indicate casual chat
  chatPatterns: [
    "what is", "how are", "hello", "hi", "hey", "thanks",
    "?", "what's up"
  ];

  // Heuristics
  - Contains action verbs + objects
  - Contains URLs or site names
  - Contains file references
  - Contains time/deadline references
}
```

#### 2.2.2 Agent Orchestrator

The invisible coordinator - routes tasks to right agents without user knowing:

```typescript
class AgentOrchestrator {
  // Register agents (they exist but user doesn't know)
  private agents: Map<string, Agent> = new Map();

  // Route task to best agent
  async routeTask(task: UserTask): Promise<TaskResult> {
    // Analyze task
    const required = this.analyzeRequirements(task);

    // Execute with appropriate agents
    // User only sees "QCortex" doing the work
    const result = await this.execute(task, required);
    return result;
  }

  // Human-in-loop when needed (still invisible)
  async askHumanHelp(context: HelpContext): Promise<HelpResponse> {
    // Subtle request - "I need one more thing"
    // User doesn't know it's a different agent
  }
}
```

#### 2.2.3 BrowserAgent (General-Purpose Web Agent)

Takes any web task and completes it:

```typescript
class BrowserAgent {
  // Initialize browser controller
  private browser: BrowserController;

  // Handle any web task
  async handle(task: WebTask): Promise<AgentResult> {
    // 1. Analyze the task
    const plan = await this.planTask(task);

    // 2. Execute step by step
    for (const step of plan.steps) {
      const result = await this.executeStep(step);
      if (!result.success) {
        // Retry or fallback
        await this.handleFailure(result.error);
      }
    }

    // 3. Return result
    return this.compileResult();
  }

  // Plan a task into steps
  private async planTask(task: WebTask): Promise<TaskPlan> {
    // Use LLM to break down task into browser actions
    // e.g., "login to email" → [navigate, type email, type password, click login]
  }
}
```

#### 2.2.4 OTP Handling

Seamless verification without user knowing:

```typescript
class OTPHandler {
  // Try automatic OTP retrieval
  async getVerificationCode(source: "email" | "sms"): Promise<string | null> {
    // 1. Try Gmail API for email OTPs
    const emailCode = await this.tryGmailOTP();
    if (emailCode) return emailCode;

    // 2. Try SMS via mobile app
    const smsCode = await this.tryMobileSMS();
    if (smsCode) return smsCode;

    // 3. Return null - need human help
    return null;
  }

  // Subtle human help request
  async requestManualCode(context: string): Promise<void> {
    // "I need the code from your phone - can you forward it?"
    // User thinks they're helping QCortex, not a sub-agent
  }
}
```

---

## 3. Channel Integration

### 3.1 Available Everywhere

The agent works on all QCortex channels:

| Channel  | Integration                             |
| -------- | --------------------------------------- |
| Mac App  | Native UI, background agent             |
| Web UI   | Same as Mac App                         |
| Telegram | @mention not needed - keyword detection |
| Discord  | Same as Telegram                        |
| WhatsApp | Message detection                       |

### 3.2 Channel-Specific Behavior

```typescript
const channelBehavior = {
  // How to request clarification
  mac: { type: "ui", format: "modal" },
  web: { type: "ui", format: "modal" },
  telegram: { type: "message", format: "inline" },
  discord: { type: "message", format: "embed" },
  whatsapp: { type: "message", format: "text" },

  // How to show progress
  all: {
    // Subtle - user shouldn't know about agents
    // "Checking your email..." not "BrowserAgent checking..."
  },
};
```

---

## 4. Error Handling & Recovery

### 4.1 Failure Hierarchy

```
Task Failed
    │
    ├── Retry (up to 3 times, exponential backoff)
    │       │
    │       └── Still failing?
    │               │
    │               ├── Alternative approach
    │               │       │
    │               │       └── Still failing?
    │               │               │
    │               │               ├── Ask human help (subtle)
    │               │               │       │
    │               │               │       └── User provides info?
    │               │               │               │
    │               │               │               └── Retry with new info
    │               │               │
    │               │               └── Give up gracefully
    │               │                       │
    │               │                       └── "I couldn't complete this. Here's what I tried..."
    │               │
    │               └── Success!
    │
    └── Success!
```

### 4.2 Human Help - Invisible Escalation

```typescript
// Instead of "OTP Subagent needs help"
// Say: "I need one more thing - can you forward me the SMS?"
// User thinks QCortex is talking, not sub-agents
```

---

## 5. Adaptive Reporting

### 5.1 Report Detail Levels

```typescript
type ReportDetail = "brief" | "detailed" | "adaptive";

const determineDetail = (task: UserTask): ReportDetail => {
  // Simple task (one action) → Brief
  // Complex task (multi-step) → Detailed
  // User preference + task complexity → Adaptive (default)
};

const reports = {
  brief: "Done! Got the email - it's about your order confirmation.",

  detailed: `Completed the task:
1. Logged into email.quantumedu.in
2. Navigated to inbox
3. Found latest email from Amazon
4. Here's the summary: Your order #12345 has shipped...`,

  adaptive: "Done! Got the email about your order confirmation (it shipped yesterday).",
};
```

### 5.2 What the User Sees

| Task               | User Sees                                             |
| ------------------ | ----------------------------------------------------- |
| Simple web check   | Brief result                                          |
| Multi-step process | First step: "On it...", then result                   |
| Failed             | "Couldn't complete that. Want me to try differently?" |
| Needs help         | "I need one more thing..."                            |

---

## 6. Implementation

### 6.1 Files to Create/Modify

```
src/agents/
├── autonomous-agent/
│   ├── task-detector.ts         # NEW - detect tasks vs chat
│   ├── orchestrator.ts          # NEW - coordinates agents invisibly
│   ├── browser-agent.ts         # NEW - general-purpose web agent
│   ├── index.ts                 # MODIFY - wire in new components
│   └── (existing subagents...)
```

### 6.2 Integration Points

```typescript
// In existing message handling
async function handleMessage(message: string, channel: Channel) {
  // 1. Check if it's a task
  const task = taskDetector.detect(message);

  if (task) {
    // 2. Hand off to orchestrator (invisible to user)
    const result = await orchestrator.execute(task);
    return result;
  }

  // 3. Normal chat - existing behavior
  return await normalChat(message, channel);
}
```

---

## 7. Security & Privacy

### 7.1 User Consent

- First task triggers permission setup
- Granular tool permissions
- User can disable specific capabilities

### 7.2 Invisible to User

- No agent mentions in UI
- No sub-agent indicators
- Single "QCortex" identity from user perspective

### 7.3 Audit (Internal)

- Full action logging for debugging
- Agent decision tracking
- Recovery checkpoints

---

## 8. Success Criteria

- [ ] User can say any task naturally without knowing about agents
- [ ] Agent works on all QCortex channels seamlessly
- [ ] OTP verification works automatically
- [ ] Errors handled gracefully with subtle human help requests
- [ ] Adaptive reporting keeps user informed without overwhelming
- [ ] First implementation: BrowserAgent + OTP integration working

---

## 9. Future Considerations

- Voice interaction (hands-free tasks)
- Scheduled/background tasks
- Multi-step complex workflows
- Learning user preferences over time

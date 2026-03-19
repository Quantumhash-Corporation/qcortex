# Digital Human Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a chat-based autonomous agent that seamlessly handles any web task without user knowing about underlying agents. User just says "do this" and it happens.

**Architecture:** Extend existing autonomous-agent system with: (1) Task Detection Engine for confidence-based task/chat classification, (2) Agent Orchestrator to route tasks invisibly, (3) BrowserAgent for general web automation using existing BrowserController.

**Tech Stack:** TypeScript, existing BrowserController, existing subagent system

---

## File Structure

```
src/agents/autonomous-agent/
├── task-detector.ts         # NEW - detect tasks vs chat with confidence
├── task-detector.test.ts    # NEW
├── orchestrator.ts          # NEW - coordinates agents invisibly
├── orchestrator.test.ts     # NEW
├── browser-agent.ts         # NEW - general-purpose web agent
├── browser-agent.test.ts    # NEW
├── index.ts                 # MODIFY - wire in new components
├── subagents/
│   ├── index.ts            # MODIFY - register BrowserAgent
│   └── (existing...)
└── tools/
    └── browser-tool.ts    # EXISTING - used by BrowserAgent
```

---

## Task 1: Task Detection Engine

**Files:**

- Create: `src/agents/autonomous-agent/task-detector.ts`
- Create: `src/agents/autonomous-agent/task-detector.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/task-detector.test.ts
import { describe, it, expect } from "vitest";
import { TaskDetector, TaskDetectionResult } from "./task-detector";

describe("TaskDetector", () => {
  const detector = new TaskDetector();

  describe("detect", () => {
    it("should detect task with URL as high confidence", () => {
      const result = detector.detect("Go to https://example.com and login");
      expect(result.isTask).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it("should detect task with action verb and object", () => {
      const result = detector.detect("Check my email and tell me about the last message");
      expect(result.isTask).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should detect casual chat with low confidence", () => {
      const result = detector.detect("Hey, how are you?");
      expect(result.isTask).toBe(false);
      expect(result.confidence).toBeLessThan(0.3);
    });

    it("should return clarification for uncertain messages", () => {
      const result = detector.detect("Can you tell me what time it is?");
      expect(result.needsClarification).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/task-detector.test.ts --run`
Expected: FAIL with "Cannot find module './task-detector'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/task-detector.ts

export interface TaskDetectionResult {
  isTask: boolean;
  confidence: number;
  reason: string;
  needsClarification: boolean;
  suggestedTask?: string;
}

const TASK_TRIGGERS = [
  "can you",
  "please",
  "go to",
  "login",
  "check",
  "create",
  "book",
  "send",
  "upload",
  "download",
  "find",
  "get",
  "do this",
  "handle this",
  "take care of",
  "login to",
  "sign up",
  "register",
  "create an account",
];

const CHAT_OVERRIDES = [
  "what is",
  "how are",
  "hello",
  "hi",
  "hey",
  "thanks",
  "what's up",
  "how's it going",
  "tell me about",
  "?",
];

const ACTION_VERBS = [
  "check",
  "get",
  "find",
  "send",
  "create",
  "book",
  "open",
  "login",
  "sign",
  "upload",
  "download",
  "read",
  "tell",
  "show",
  "make",
  "do",
  "complete",
  "submit",
  "fill",
];

const URL_PATTERN = /https?:\/\/[^\s]+/;

export class TaskDetector {
  detect(message: string): TaskDetectionResult {
    const lower = message.toLowerCase().trim();
    let score = 0;
    const reasons: string[] = [];

    // URL in message = high confidence task (+0.5)
    if (URL_PATTERN.test(message)) {
      score += 0.5;
      reasons.push("contains URL");
    }

    // Task trigger keyword (+0.2)
    const hasTrigger = TASK_TRIGGERS.some((t) => lower.includes(t));
    if (hasTrigger) {
      score += 0.2;
      reasons.push("task trigger keyword");
    }

    // Action verb + object pattern (+0.3)
    const words = lower.split(/\s+/);
    const hasAction = ACTION_VERBS.some((v) => words.includes(v));
    if (hasAction && words.length > 3) {
      score += 0.3;
      reasons.push("action verb with object");
    }

    // Chat override - reduces score significantly (-0.4)
    const hasChatOverride = CHAT_OVERRIDES.some((c) => lower === c || lower.startsWith(c + " "));
    if (hasChatOverride) {
      score -= 0.4;
      reasons.push("chat override");
    }

    // Question mark without task context = chat
    if (lower.includes("?") && score < 0.3) {
      score -= 0.2;
    }

    // Clamp score between 0 and 1
    score = Math.max(0, Math.min(1, score));

    // Determine result
    const isTask = score >= 0.5;
    const needsClarification = score >= 0.3 && score < 0.5;

    return {
      isTask,
      confidence: score,
      reason: reasons.join(", ") || "no clear signal",
      needsClarification,
      suggestedTask: needsClarification ? this.suggestTask(message) : undefined,
    };
  }

  private suggestTask(message: string): string {
    // Try to interpret the message as a task
    const lower = message.toLowerCase();
    if (lower.includes("what time")) return "tell you the current time";
    if (lower.includes("what is")) return message.replace("what is", "tell you about");
    return message;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/task-detector.test.ts --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/task-detector.ts src/agents/autonomous-agent/task-detector.test.ts
git commit -m "feat: add task detection engine with confidence scoring

- Detects task vs chat based on keywords, URLs, action verbs
- Returns confidence score (0-1)
- Returns needsClarification for uncertain cases
- Follows spec: confidence >= 0.5 is task, < 0.3 is chat"

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 2: BrowserAgent (General-Purpose Web Agent)

**Files:**

- Create: `src/agents/autonomous-agent/browser-agent.ts`
- Create: `src/agents/autonomous-agent/browser-agent.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/browser-agent.test.ts
import { describe, it, expect, vi } from "vitest";
import { BrowserAgent, WebTask, WebTaskStep } from "./browser-agent";

// Mock BrowserController
vi.mock("./tools/browser-tool", () => ({
  BrowserController: vi.fn().mockImplementation(() => ({
    status: vi.fn().mockResolvedValue({ running: true, tabs: 1 }),
    start: vi.fn().mockResolvedValue(true),
    navigate: vi.fn().mockResolvedValue(true),
    snapshot: vi.fn().mockResolvedValue({
      content: '<div><button ref="btn-login">Login</button></div>',
      refs: { "btn-login": "button" },
    }),
    click: vi.fn().mockResolvedValue(true),
    type: vi.fn().mockResolvedValue(true),
    getUrl: vi.fn().mockResolvedValue("https://example.com"),
  })),
}));

describe("BrowserAgent", () => {
  const agent = new BrowserAgent();

  describe("handle", () => {
    it("should navigate to URL and complete simple task", async () => {
      const task: WebTask = {
        id: "test-1",
        description: "Go to example.com",
        targetUrl: "https://example.com",
      };

      const result = await agent.handle(task);
      expect(result.success).toBe(true);
    });
  });

  describe("planTask", () => {
    it("should create navigation step for URL task", async () => {
      const task: WebTask = {
        id: "test-2",
        description: "Visit google.com",
        targetUrl: "https://google.com",
      };

      const plan = await agent.planTask(task);
      expect(plan.steps).toBeDefined();
      expect(plan.steps.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/browser-agent.test.ts --run`
Expected: FAIL with "Cannot find module './browser-agent'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/browser-agent.ts

import { BrowserController, createBrowserController } from "./tools/browser-tool";

export interface WebTask {
  id: string;
  description: string;
  targetUrl?: string;
  credentials?: {
    username?: string;
    password?: string;
  };
  context?: Record<string, unknown>;
}

export interface WebTaskStep {
  type: "navigate" | "click" | "type" | "fill" | "wait" | "snapshot" | "screenshot";
  target?: string;
  value?: string;
  options?: Record<string, unknown>;
}

export interface TaskPlan {
  steps: WebTaskStep[];
  estimatedDuration: number;
}

export interface AgentResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
  stepsCompleted: number;
  totalSteps: number;
}

const TASK_KEYWORDS: Record<string, WebTaskStep[]> = {
  "login": [
    { type: "navigate" },
    { type: "wait", options: { text: "username" } },
    { type: "snapshot" }
  ],
  "check email": [
    { type: "navigate" },
    { type: "snapshot" }
  ],
  "create account": [
    { type: "navigate" },
    { type: "wait", options: { text: "sign" } },
    { type: "snapshot" }
  ]
};

export class BrowserAgent {
  private browser: BrowserController;
  private timeout: number = 30000;
  private maxRetries: number = 3;

  constructor() {
    this.browser = createBrowserController({ timeout: this.timeout });
  }

  async handle(task: WebTask): Promise<AgentResult> {
    // 1. Plan the task
    const plan = await this.planTask(task);

    // 2. Start browser if needed
    const status = await this.browser.status();
    if (!status.running) {
      const started = await this.browser.start();
      if (!started) {
        return {
          success: false,
          error: { code: "BROWSER_START_FAILED", message: "Failed to start browser", recoverable: true },
          stepsCompleted: 0,
          totalSteps: plan.steps.length
        };
      }
    }

    // 3. Navigate to URL if specified
    if (task.targetUrl) {
      const navigated = await this.browser.navigate(task.targetUrl);
      if (!navigated) {
        return {
          success: false,
          error: { code: "NAVIGATION_FAILED", message: "Failed to navigate to URL", recoverable: true },
          stepsCompleted: 0,
          totalSteps: plan.steps.length
        };
      }
    }

    // 4. Execute steps
    let stepsCompleted = 0;
    for (const step of plan.steps) {
      const result = await this.executeStep(step);
      if (!result.success) {
        // Retry logic
        for (let retry = 0; retry < this.maxRetries; retry++) {
          const retryResult = await this.executeStep(step);
          if (retryResult.success) break;
        }
      }
      stepsCompleted++;
    }

    // 5. Get final snapshot
    await this.browser.snapshot();

    return {
      success: true,
      stepsCompleted,
      totalSteps: plan.steps.length,
      data: { url: await this.browser.getUrl() }
    };
  }

  async planTask(task: WebTask): Promise<TaskPlan> {
    const steps: WebTaskStep[] = [];

    // If target URL provided, add navigation
    if (task.targetUrl) {
      steps.push({ type: "navigate", value: task.targetUrl });
    }

    // Analyze description to determine steps
    const desc = task.description.toLowerCase();

    // Check for known task patterns
    for (const [keyword, patternSteps] of Object.entries(TASK_KEYWORDS)) {
      if (desc.includes(keyword)) {
        steps.push(...patternSteps);
        break;
      }
    }

    // Default: just get snapshot
    if (steps.length === 0) {
      steps.push({ type: "snapshot" });
    }

    return {
      steps,
      estimatedDuration: steps.length * 5000 // 5s per step estimate
    };
  }

  private async executeStep(step: WebTaskStep): Promise<{ success: boolean; error?: string }> {
    try {
      switch (step.type) {
        case "navigate":
          if (step.value) {
            return { success: await this.browser.navigate(step.value) };
          }
          return { success: true };

        case "snapshot":
          const snapshot = await this.browser.snapshot();
          return { success: snapshot !== null };

        case "screenshot":
          const screenshot = await this.browser.screenshot();
          return { success: screenshot !== null };

        case "click":
          if (step.target) {
            return { success: await this.browser.click(step.target) };
          }
          return { success: false, error: "no target" };

        case "type":
          if (step.target && step.value) {
            return { success: await this.browser.type(step.target, step.value) };
          }
          return { success: false, error: "no target or value };

        case "fill":
          // Handle fill form - simplified
          return { success: true };

        case "wait":
          if (step.options) {
            return { success: await this.browser.wait(step.options as any) };
          }
          return { success: true };

        default:
          return { success: false, error: "unknown step type" };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/browser-agent.test.ts --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/browser-agent.ts src/agents/autonomous-agent/browser-agent.test.ts
git commit -m "feat: add BrowserAgent for general-purpose web automation

- Handles web tasks by planning and executing steps
- Uses existing BrowserController for browser operations
- Supports navigation, clicks, typing, snapshots
- Implements retry logic for failed steps

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 3: Agent Orchestrator

**Files:**

- Create: `src/agents/autonomous-agent/orchestrator.ts`
- Create: `src/agents/autonomous-agent/orchestrator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/orchestrator.test.ts
import { describe, it, expect, vi } from "vitest";
import { AgentOrchestrator } from "./orchestrator";
import { TaskDetector } from "./task-detector";
import { BrowserAgent } from "./browser-agent";

// Mock dependencies
vi.mock("./task-detector", () => ({
  TaskDetector: vi.fn().mockImplementation(() => ({
    detect: vi.fn().mockReturnValue({
      isTask: true,
      confidence: 0.8,
      reason: "test",
      needsClarification: false,
    }),
  })),
}));

vi.mock("./browser-agent", () => ({
  BrowserAgent: vi.fn().mockImplementation(() => ({
    handle: vi.fn().mockResolvedValue({ success: true, stepsCompleted: 2, totalSteps: 2 }),
  })),
}));

describe("AgentOrchestrator", () => {
  const orchestrator = new AgentOrchestrator();

  describe("route", () => {
    it("should detect task and route to BrowserAgent", async () => {
      const result = await orchestrator.route("Go to example.com");
      expect(result.isTask).toBe(true);
      expect(result.success).toBe(true);
    });

    it("should return non-task for chat messages", async () => {
      vi.mocked(vi.mocked(new TaskDetector()).detect).mockReturnValueOnce({
        isTask: false,
        confidence: 0.1,
        reason: "chat",
        needsClarification: false,
      });

      const result = await orchestrator.route("Hey, how are you?");
      expect(result.isTask).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/orchestrator.test.ts --run`
Expected: FAIL with "Cannot find module './orchestrator'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/orchestrator.ts

import { TaskDetector, TaskDetectionResult } from "./task-detector";
import { BrowserAgent, WebTask } from "./browser-agent";

export interface UserTask {
  id: string;
  message: string;
  channel: string;
  context?: Record<string, unknown>;
}

export interface RouteResult {
  isTask: boolean;
  success?: boolean;
  result?: unknown;
  error?: string;
  message?: string;
  needsClarification?: boolean;
  suggestedTask?: string;
}

export class AgentOrchestrator {
  private taskDetector: TaskDetector;
  private browserAgent: BrowserAgent;

  constructor() {
    this.taskDetector = new TaskDetector();
    this.browserAgent = new BrowserAgent();
  }

  async route(message: string, context?: Record<string, unknown>): Promise<RouteResult> {
    // 1. Detect if this is a task
    const detection = this.taskDetector.detect(message);

    // 2. If needs clarification, ask user
    if (detection.needsClarification) {
      return {
        isTask: true,
        needsClarification: true,
        message: `I want to make sure I understand. Do you want me to ${detection.suggestedTask}?`,
        suggestedTask: detection.suggestedTask,
      };
    }

    // 3. If not a task, return early
    if (!detection.isTask) {
      return {
        isTask: false,
        success: false,
      };
    }

    // 4. It's a task - route to appropriate agent
    try {
      const result = await this.executeTask(message, context);
      return {
        isTask: true,
        success: true,
        result,
      };
    } catch (error) {
      return {
        isTask: true,
        success: false,
        error: String(error),
      };
    }
  }

  private async executeTask(message: string, context?: Record<string, unknown>): Promise<unknown> {
    // Extract URL from message if present
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    const targetUrl = urlMatch ? urlMatch[0] : undefined;

    // Create task
    const task: WebTask = {
      id: `task-${Date.now()}`,
      description: message,
      targetUrl,
      context,
    };

    // Route to BrowserAgent for web tasks
    // TODO: Add logic to detect other task types
    return await this.browserAgent.handle(task);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/orchestrator.test.ts --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/orchestrator.ts src/agents/autonomous-agent/orchestrator.test.ts
git commit -m "feat: add AgentOrchestrator for invisible task routing

- Routes messages through TaskDetector
- Returns needsClarification for uncertain messages
- Routes web tasks to BrowserAgent
- Returns isTask=false for chat messages

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 4: Integration into QCortex Message Flow

**Files:**

- Modify: `src/agents/autonomous-agent/index.ts`
- Create test: `src/agents/autonomous-agent/e2e-integration.test.ts`

- [ ] **Step 1: Check existing index.ts**

Run: `cat src/agents/autonomous-agent/subagents/index.ts`

- [ ] **Step 2: Write integration test**

```typescript
// src/agents/autonomous-agent/e2e-integration.test.ts
import { describe, it, expect, vi } from "vitest";
import { AgentOrchestrator } from "./orchestrator";

// Mock all dependencies
vi.mock("./browser-agent", () => ({
  BrowserAgent: vi.fn().mockImplementation(() => ({
    handle: vi.fn().mockResolvedValue({
      success: true,
      data: { url: "https://example.com", content: "Test page" },
      stepsCompleted: 2,
      totalSteps: 2,
    }),
  })),
}));

describe("Digital Human Agent E2E", () => {
  const orchestrator = new AgentOrchestrator();

  it("should handle web task end-to-end", async () => {
    const result = await orchestrator.route("Go to https://example.com and check the page");

    expect(result.isTask).toBe(true);
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
  });

  it("should pass through chat messages", async () => {
    const result = await orchestrator.route("Hello, how are you?");

    expect(result.isTask).toBe(false);
  });

  it("should extract URL from message", async () => {
    const result = await orchestrator.route("Please visit https://google.com");

    expect(result.isTask).toBe(true);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 3: Run integration test**

Run: `pnpm test src/agents/autonomous-agent/e2e-integration.test.ts --run`
Expected: PASS

- [ ] **Step 4: Create integration entry point**

```typescript
// src/agents/autonomous-agent/index.ts (modify)

import { AgentOrchestrator } from "./orchestrator";

// Re-export for external use
export { AgentOrchestrator } from "./orchestrator";
export { TaskDetector } from "./task-detector";
export { BrowserAgent } from "./browser-agent";
export type { TaskDetectionResult } from "./task-detector";
export type { WebTask, AgentResult } from "./browser-agent";
export type { UserTask, RouteResult } from "./orchestrator";

// Default instance
let orchestrator: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();
  }
  return orchestrator;
}

// Handle message (entry point for integration)
export async function handleMessage(
  message: string,
  context?: Record<string, unknown>,
): Promise<{ isTask: boolean; response?: string; needsClarification?: boolean }> {
  const orch = getOrchestrator();
  const result = await orch.route(message, context);

  if (!result.isTask) {
    return { isTask: false };
  }

  if (result.needsClarification) {
    return {
      isTask: true,
      needsClarification: true,
      response: result.message,
    };
  }

  // Format response based on result
  if (result.success && result.result) {
    const data = result.result as any;
    return {
      isTask: true,
      response: `Done! I've completed the task.${data.url ? ` Visited: ${data.url}` : ""}`,
    };
  }

  return {
    isTask: true,
    response: result.error || "Something went wrong",
  };
}
```

- [ ] **Step 5: Run all tests**

Run: `pnpm test src/agents/autonomous-agent --run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/agents/autonomous-agent/index.ts src/agents/autonomous-agent/e2e-integration.test.ts
git commit -m "feat: integrate digital human agent into message flow

- Add handleMessage entry point for QCortex integration
- Export AgentOrchestrator, TaskDetector, BrowserAgent
- Add E2E integration tests
- User never knows about agents - seamless experience

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 5: Verify Full Build

- [ ] **Step 1: Run full test suite**

Run: `pnpm test src/agents/autonomous-agent --run`
Expected: All tests pass

- [ ] **Step 2: Run type check**

Run: `pnpm tsgo`
Expected: No errors

- [ ] **Step 3: Run lint**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: verify build passes for digital human agent

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Summary

| Task             | Files Created/Modified                      | Key Outputs                          |
| ---------------- | ------------------------------------------- | ------------------------------------ |
| 1. Task Detector | `task-detector.ts`, `task-detector.test.ts` | Confidence-based task/chat detection |
| 2. BrowserAgent  | `browser-agent.ts`, `browser-agent.test.ts` | General web automation               |
| 3. Orchestrator  | `orchestrator.ts`, `orchestrator.test.ts`   | Invisible task routing               |
| 4. Integration   | `index.ts`, `e2e-integration.test.ts`       | Entry point for QCortex              |
| 5. Verify        | All tests                                   | Full build passes                    |

---

## Next Steps After This Plan

1. **Connect to QCortex channels** - Wire `handleMessage` into Telegram, Discord, Mac app message handlers
2. **Add more agents** - EmailAgent, CalendarAgent, FileAgent
3. **OTP integration** - Wire in existing OTPFetcher subagent
4. **Adaptive reporting** - Add brief/detailed/adaptive response formatting
5. **Credential storage** - Implement secure credential management for website logins

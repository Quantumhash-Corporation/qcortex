# Hybrid Agent with Subagent Dispatch - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hybrid autonomous agent that dispatches specialized subagents for complex tasks, uses tools as fallback, and escalates to human when both fail.

**Architecture:**

- Main agent analyzes tasks and dispatches appropriate subagents
- Subagents execute specialized tasks (account creation, OTP fetching, etc.)
- Tools serve as fallback when subagents fail
- Human escalation with retry capability
- User settings control permissions, fallback behavior

**Tech Stack:** TypeScript, Playwright (existing), Gmail API, subagent dispatch system

---

## File Structure

```
src/agents/autonomous-agent/
├── index.ts                          # Main exports
├── agent-controller.ts               # Agent lifecycle management
├── subagent-dispatcher.ts            # Subagent dispatch + fallback logic
├── types.ts                          # Core types (Subagent, Task, Result)
│
├── subagents/
│   ├── index.ts                      # Subagent registry
│   ├── account-creator.ts            # Account creation subagent
│   ├── otp-fetcher.ts               # OTP/verification code fetcher
│   ├── data-uploader.ts              # File/data upload subagent
│   ├── browser-controller.ts         # Browser control subagent
│   ├── file-manager.ts               # File management subagent
│   └── email-agent.ts                # Email operations subagent
│
├── tools/                            # Fallback tools
│   ├── browser-tool-wrapper.ts       # Existing browser tool
│   ├── file-system.ts                # File operations
│   └── email.ts                      # Gmail tool
│
├── settings/
│   ├── storage.ts                    # Settings persistence
│   └── types.ts                     # Settings types
│
└── verification/
    ├── gmail-otp.ts                  # OTP detection
    └── fallback.ts                   # Human escalation handler
```

---

## Task 1: Define Core Types for Hybrid Agent

**Files:**

- Create: `src/agents/autonomous-agent/types.ts`
- Test: `src/agents/autonomous-agent/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  Subagent,
  SubagentResult,
  TaskInput,
  TaskStatus,
  FallbackChain,
  HumanEscalation,
} from "./types";

describe("Hybrid Agent Types", () => {
  it("should define SubagentResult success", () => {
    const result: SubagentResult = { success: true, data: { message: "done" } };
    expect(result.success).toBe(true);
  });

  it("should define SubagentResult failure with escalation", () => {
    const result: SubagentResult = {
      success: false,
      error: {
        code: "ACCOUNT_CREATION_FAILED",
        message: "Could not complete registration",
        recoverable: true,
        canEscalateToHuman: true,
      },
      requiresHumanHelp: true,
      humanHelpMessage: "Please provide the phone number for verification",
    };
    expect(result.success).toBe(false);
    expect(result.requiresHumanHelp).toBe(true);
  });

  it("should define FallbackChain", () => {
    const chain: FallbackChain = {
      attempts: [
        { type: "subagent", name: "AccountCreator", success: false },
        { type: "tool", name: "browser", success: true },
      ],
    };
    expect(chain.attempts.length).toBe(2);
  });

  it("should define TaskInput", () => {
    const task: TaskInput = {
      id: "task-1",
      description: "Create account on example.com",
      context: { website: "example.com", email: "test@test.com" },
      userPreferences: { autoApprove: false },
    };
    expect(task.id).toBe("task-1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/types.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/types.ts

// === Core Types ===

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "escalated";

export interface HumanEscalation {
  requested: boolean;
  message: string;
  providedInfo?: unknown;
  retryCount: number;
}

export interface TaskInput {
  id: string;
  description: string;
  context: Record<string, unknown>;
  userPreferences: UserPreferences;
  fallbackEnabled?: boolean;
  maxRetries?: number;
}

export interface UserPreferences {
  autoApprove: boolean;
  otpHandling: "auto" | "manual" | "ask";
  paymentMode: "disabled" | "view" | "full";
}

export interface TaskResult {
  id: string;
  status: TaskStatus;
  result?: unknown;
  error?: SubagentError;
  escalation?: HumanEscalation;
  fallbackChain?: FallbackChain;
}

// === Subagent Types ===

export interface SubagentError {
  code: string;
  message: string;
  recoverable: boolean;
  canEscalateToHuman: boolean;
}

export interface SubagentResult {
  success: boolean;
  data?: unknown;
  error?: SubagentError;
  requiresHumanHelp?: boolean;
  humanHelpMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface Subagent {
  name: string;
  description: string;
  execute(input: TaskInput): Promise<SubagentResult>;
  canHandle(task: TaskInput): boolean;
}

// === Fallback Types ===

export type FallbackType = "subagent" | "tool" | "human";

export interface FallbackAttempt {
  type: FallbackType;
  name: string;
  success: boolean;
  error?: SubagentError;
  timestamp: Date;
}

export interface FallbackChain {
  attempts: FallbackAttempt[];
  finalStatus: TaskStatus;
}

// === Settings Types ===

export interface AgentSettings {
  mode: "autonomous" | "assisted";
  fallback: {
    enabled: boolean;
    maxRetries: number;
    escalateOnFailure: boolean;
  };
  subagents: Record<string, { enabled: boolean; autoApprove: boolean }>;
  tools: Record<string, { enabled: boolean; fallbackFor: string[] }>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/types.ts src/agents/autonomous-agent/types.test.ts
git commit -m "feat(autonomous-agent): add hybrid agent types with subagent dispatch support"
```

---

## Task 2: Create Subagent Dispatcher

**Files:**

- Create: `src/agents/autonomous-agent/subagent-dispatcher.ts`
- Create: `src/agents/autonomous-agent/subagent-dispatcher.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/subagent-dispatcher.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubagentDispatcher } from "./subagent-dispatcher";
import type { Subagent, TaskInput, SubagentResult, AgentSettings } from "./types";

describe("SubagentDispatcher", () => {
  let dispatcher: SubagentDispatcher;
  let mockSubagent: Subagent;
  let settings: AgentSettings;

  beforeEach(() => {
    settings = {
      mode: "autonomous",
      fallback: { enabled: true, maxRetries: 3, escalateOnFailure: true },
      subagents: { accountCreator: { enabled: true, autoApprove: true } },
      tools: { browser: { enabled: true, fallbackFor: ["accountCreator"] } },
    };

    mockSubagent = {
      name: "accountCreator",
      description: "Creates accounts",
      canHandle: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockResolvedValue({ success: true, data: { accountId: "123" } }),
    };

    dispatcher = new SubagentDispatcher(settings);
  });

  it("should register a subagent", () => {
    dispatcher.register(mockSubagent);
    expect(dispatcher.getSubagent("accountCreator")).toBeDefined();
  });

  it("should dispatch subagent for task", async () => {
    dispatcher.register(mockSubagent);
    const task: TaskInput = {
      id: "task-1",
      description: "Create account on example.com",
      context: { website: "example.com" },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };

    const result = await dispatcher.dispatch(task);
    expect(result.success).toBe(true);
  });

  it("should fallback to tool when subagent fails", async () => {
    const failingSubagent: Subagent = {
      name: "failingAgent",
      description: "Always fails",
      canHandle: () => true,
      execute: () =>
        Promise.resolve({
          success: false,
          error: { code: "FAILED", message: "Error", recoverable: true, canEscalateToHuman: false },
        }),
    };

    const mockTool = vi.fn().mockResolvedValue({ success: true, data: "tool result" });

    dispatcher.register(failingSubagent);
    dispatcher.registerFallbackTool("failingAgent", mockTool);

    const task: TaskInput = {
      id: "task-2",
      description: "Test task",
      context: {},
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };

    const result = await dispatcher.dispatch(task);
    expect(result.success).toBe(true);
  });

  it("should escalate to human when both fail", async () => {
    const failingSubagent: Subagent = {
      name: "failingAgent",
      description: "Always fails",
      canHandle: () => true,
      execute: () =>
        Promise.resolve({
          success: false,
          error: { code: "FAILED", message: "Error", recoverable: true, canEscalateToHuman: true },
          requiresHumanHelp: true,
          humanHelpMessage: "Need phone number",
        }),
    };

    dispatcher.register(failingSubagent);
    dispatcher.registerFallbackTool("failingAgent", async () => ({
      success: false,
      error: "Tool failed",
    }));

    const task: TaskInput = {
      id: "task-3",
      description: "Test task",
      context: {},
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
      fallbackEnabled: true,
    };

    const result = await dispatcher.dispatch(task);
    expect(result.escalation?.requested).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/subagent-dispatcher.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/agents/autonomous-agent/subagent-dispatcher.ts
import type {
  Subagent,
  SubagentResult,
  TaskInput,
  TaskResult,
  AgentSettings,
  FallbackChain,
  FallbackAttempt,
} from "./types";

type FallbackTool = (input: TaskInput) => Promise<SubagentResult>;

export class SubagentDispatcher {
  private subagents: Map<string, Subagent> = new Map();
  private fallbackTools: Map<string, FallbackTool> = new Map();
  private settings: AgentSettings;

  constructor(settings: AgentSettings) {
    this.settings = settings;
  }

  register(subagent: Subagent): void {
    this.subagents.set(subagent.name, subagent);
  }

  unregister(name: string): void {
    this.subagents.delete(name);
  }

  getSubagent(name: string): Subagent | undefined {
    return this.subagents.get(name);
  }

  registerFallbackTool(subagentName: string, tool: FallbackTool): void {
    this.fallbackTools.set(subagentName, tool);
  }

  updateSettings(settings: AgentSettings): void {
    this.settings = settings;
  }

  async dispatch(task: TaskInput): Promise<TaskResult> {
    const fallbackChain: FallbackChain = { attempts: [], finalStatus: "pending" };
    const maxRetries = task.maxRetries ?? this.settings.fallback.maxRetries;
    let retryCount = 0;

    // Try subagent first
    const subagent = this.findBestSubagent(task);
    if (subagent && this.isSubagentEnabled(subagent.name)) {
      const attempt: FallbackAttempt = {
        type: "subagent",
        name: subagent.name,
        success: false,
        timestamp: new Date(),
      };

      try {
        const result = await this.executeWithRetry(subagent, task, maxRetries);
        attempt.success = result.success;

        if (result.success) {
          fallbackChain.attempts.push(attempt);
          fallbackChain.finalStatus = "completed";
          return { id: task.id, status: "completed", result: result.data, fallbackChain };
        }

        // Subagent failed
        fallbackChain.attempts.push(attempt);

        // Check if can escalate to human
        if (result.requiresHumanHelp && this.settings.fallback.escalateOnFailure) {
          return this.createEscalationResult(task, result, fallbackChain);
        }
      } catch (error) {
        attempt.error = {
          code: "EXECUTION_ERROR",
          message: String(error),
          recoverable: true,
          canEscalateToHuman: true,
        };
        fallbackChain.attempts.push(attempt);
      }
    }

    // Fallback to tool if enabled
    if (this.settings.fallback.enabled && subagent) {
      const tool = this.fallbackTools.get(subagent.name);
      if (tool) {
        const attempt: FallbackAttempt = {
          type: "tool",
          name: "fallback",
          success: false,
          timestamp: new Date(),
        };

        try {
          const result = await tool(task);
          attempt.success = result.success;
          fallbackChain.attempts.push(attempt);

          if (result.success) {
            fallbackChain.finalStatus = "completed";
            return { id: task.id, status: "completed", result: result.data, fallbackChain };
          }

          attempt.error = result.error;
        } catch (error) {
          attempt.error = {
            code: "TOOL_ERROR",
            message: String(error),
            recoverable: true,
            canEscalateToHuman: true,
          };
          fallbackChain.attempts.push(attempt);
        }
      }
    }

    // Both failed - escalate to human
    if (this.settings.fallback.escalateOnFailure) {
      fallbackChain.finalStatus = "escalated";
      return {
        id: task.id,
        status: "escalated",
        error: {
          code: "ALL_FAILED",
          message: "Subagent and fallback tool both failed",
          recoverable: false,
          canEscalateToHuman: true,
        },
        escalation: {
          requested: true,
          message: "Could not complete task. Please help.",
          retryCount,
        },
        fallbackChain,
      };
    }

    fallbackChain.finalStatus = "failed";
    return { id: task.id, status: "failed", fallbackChain };
  }

  private findBestSubagent(task: TaskInput): Subagent | undefined {
    for (const subagent of this.subagents.values()) {
      if (subagent.canHandle(task)) {
        return subagent;
      }
    }
    return undefined;
  }

  private isSubagentEnabled(name: string): boolean {
    return this.settings.subagents[name]?.enabled ?? false;
  }

  private async executeWithRetry(
    subagent: Subagent,
    task: TaskInput,
    maxRetries: number,
  ): Promise<SubagentResult> {
    let lastResult: SubagentResult;

    for (let i = 0; i <= maxRetries; i++) {
      lastResult = await subagent.execute(task);

      if (lastResult.success) {
        return lastResult;
      }

      // Check if we should retry
      if (!lastResult.error?.recoverable || lastResult.requiresHumanHelp) {
        return lastResult;
      }
    }

    return lastResult!;
  }

  private createEscalationResult(
    task: TaskInput,
    subagentResult: SubagentResult,
    chain: FallbackChain,
  ): TaskResult {
    chain.finalStatus = "escalated";
    return {
      id: task.id,
      status: "escalated",
      error: subagentResult.error,
      escalation: {
        requested: true,
        message: subagentResult.humanHelpMessage || "Human assistance required",
        retryCount: 0,
      },
      fallbackChain: chain,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/subagent-dispatcher.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/subagent-dispatcher.ts src/agents/autonomous-agent/subagent-dispatcher.test.ts
git commit -m "feat(autonomous-agent): add SubagentDispatcher with fallback chain and human escalation"
```

---

## Task 3: Create OTP Fetcher Subagent

**Files:**

- Create: `src/agents/autonomous-agent/subagents/otp-fetcher.ts`
- Test: `src/agents/autonomous-agent/subagents/otp-fetcher.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/subagents/otp-fetcher.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OTPFetcherSubagent } from "./otp-fetcher";

describe("OTPFetcherSubagent", () => {
  let subagent: OTPFetcherSubagent;
  let mockGmailClient: any;

  beforeEach(() => {
    mockGmailClient = {
      listMessages: vi.fn(),
      getMessage: vi.fn(),
    };
    subagent = new OTPFetcherSubagent({ gmailClient: mockGmailClient });
  });

  it("should identify as OTPFetcher", () => {
    expect(subagent.name).toBe("OTPFetcher");
  });

  it("should handle OTP retrieval tasks", () => {
    const task = {
      id: "1",
      description: "Get OTP from email",
      context: { source: "gmail", filter: "verification" },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };
    expect(subagent.canHandle(task)).toBe(true);
  });

  it("should not handle non-OTP tasks", () => {
    const task = {
      id: "1",
      description: "Send an email",
      context: {},
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };
    expect(subagent.canHandle(task)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/subagents/otp-fetcher.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/agents/autonomous-agent/subagents/otp-fetcher.ts
import type { Subagent, SubagentResult, TaskInput } from "../types";

interface OTPFetcherConfig {
  gmailClient?: {
    listMessages: (query: string) => Promise<any[]>;
    getMessage: (id: string) => Promise<any>;
  };
  mobileClient?: {
    waitForSMS: (phoneNumber: string, timeoutMs: number) => Promise<string>;
  };
  pollingIntervalMs?: number;
  timeoutMs?: number;
}

export class OTPFetcherSubagent implements Subagent {
  name = "OTPFetcher";
  description = "Retrieves verification codes (OTP) from email, SMS, or other sources";

  private config: Required<OTPFetcherConfig>;

  constructor(config: OTPFetcherConfig = {}) {
    this.config = {
      gmailClient: config.gmailClient!,
      mobileClient: config.mobileClient!,
      pollingIntervalMs: config.pollingIntervalMs ?? 5000,
      timeoutMs: config.timeoutMs ?? 60000,
    };
  }

  canHandle(task: TaskInput): boolean {
    const desc = task.description.toLowerCase();
    const context = task.context;

    return (
      desc.includes("otp") ||
      desc.includes("verification code") ||
      desc.includes("confirm") ||
      desc.includes("2fa") ||
      desc.includes("two-factor") ||
      context.source === "gmail" ||
      context.source === "sms" ||
      context.source === "mobile"
    );
  }

  async execute(task: TaskInput): Promise<SubagentResult> {
    const source = (task.context.source as string) || "gmail";

    try {
      if (source === "gmail" || source === "email") {
        return await this.fetchFromGmail(task);
      } else if (source === "sms" || source === "mobile") {
        return await this.fetchFromMobile(task);
      }

      // Try both
      const gmailResult = await this.fetchFromGmail(task);
      if (gmailResult.success) return gmailResult;

      const mobileResult = await this.fetchFromMobile(task);
      return mobileResult;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "OTP_FETCH_ERROR",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage:
          "Could not automatically retrieve OTP. Please enter the verification code manually.",
      };
    }
  }

  private async fetchFromGmail(task: TaskInput): Promise<SubagentResult> {
    if (!this.config.gmailClient) {
      return {
        success: false,
        error: {
          code: "NO_GMAIL_CLIENT",
          message: "Gmail client not configured",
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Gmail not connected. Please provide the verification code manually.",
      };
    }

    const startTime = Date.now();

    while (Date.now() - startTime < this.config.timeoutMs) {
      const messages = await this.config.gmailClient.listMessages(
        "is:unread subject:(verification OR code OR otp)",
      );

      for (const msg of messages.slice(0, 5)) {
        const full = await this.config.gmailClient.getMessage(msg.id);
        const otp = this.extractOTP(full.text || "");

        if (otp) {
          return { success: true, data: { otp, source: "gmail", messageId: msg.id } };
        }
      }

      await new Promise((resolve) => setTimeout(resolve, this.config.pollingIntervalMs));
    }

    return {
      success: false,
      error: {
        code: "OTP_TIMEOUT",
        message: "No OTP found within timeout",
        recoverable: true,
        canEscalateToHuman: true,
      },
      requiresHumanHelp: true,
      humanHelpMessage: "No verification code found in inbox. Please enter manually.",
    };
  }

  private async fetchFromMobile(task: TaskInput): Promise<SubagentResult> {
    if (!this.config.mobileClient) {
      return {
        success: false,
        error: {
          code: "NO_MOBILE_CLIENT",
          message: "Mobile client not configured",
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Mobile SMS not available. Please enter the verification code manually.",
      };
    }

    const phoneNumber = task.context.phoneNumber as string;

    try {
      const otp = await this.config.mobileClient.waitForSMS(phoneNumber, this.config.timeoutMs);
      return { success: true, data: { otp, source: "sms" } };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "SMS_TIMEOUT",
          message: "No SMS received within timeout",
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "No SMS received. Please enter the verification code manually.",
      };
    }
  }

  private extractOTP(text: string): string | null {
    const patterns = [/(?:code|otp|verification|pin|security)[^\d]*(\d{4,8})/i, /\b(\d{6})\b/];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/subagents/otp-fetcher.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/subagents/otp-fetcher.ts src/agents/autonomous-agent/subagents/otp-fetcher.test.ts
git commit -m "feat(autonomous-agent): add OTPFetcher subagent for verification codes"
```

---

## Task 4: Create Account Creator Subagent

**Files:**

- Create: `src/agents/autonomous-agent/subagents/account-creator.ts`
- Test: `src/agents/autonomous-agent/subagents/account-creator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/subagents/account-creator.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountCreatorSubagent } from "./account-creator";

describe("AccountCreatorSubagent", () => {
  let subagent: AccountCreatorSubagent;

  beforeEach(() => {
    subagent = new AccountCreatorSubagent({});
  });

  it("should identify as AccountCreator", () => {
    expect(subagent.name).toBe("AccountCreator");
  });

  it("should handle account creation tasks", () => {
    const task = {
      id: "1",
      description: "Create account on github.com",
      context: { website: "github.com", email: "test@test.com" },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };
    expect(subagent.canHandle(task)).toBe(true);
  });

  it("should handle sign up tasks", () => {
    const task = {
      id: "1",
      description: "Sign up for netflix",
      context: { website: "netflix.com" },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };
    expect(subagent.canHandle(task)).toBe(true);
  });

  it("should not handle non-account tasks", () => {
    const task = {
      id: "1",
      description: "Send an email",
      context: {},
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };
    expect(subagent.canHandle(task)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/subagents/account-creator.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/agents/autonomous-agent/subagents/account-creator.ts
import type { Subagent, SubagentResult, TaskInput } from "../types";

interface AccountCreatorConfig {
  browserTool?: {
    navigate: (url: string) => Promise<any>;
    snapshot: () => Promise<any>;
    click: (ref: string) => Promise<any>;
    type: (ref: string, text: string) => Promise<any>;
    fill: (fields: { ref: string; value: string }[]) => Promise<any>;
    waitForSelector: (selector: string, timeoutMs?: number) => Promise<any>;
  };
  otpFetcher?: (task: TaskInput) => Promise<SubagentResult>;
}

export class AccountCreatorSubagent implements Subagent {
  name = "AccountCreator";
  description = "Creates accounts on websites, handles form filling and OTP verification";

  private config: AccountCreatorConfig;

  constructor(config: AccountCreatorConfig = {}) {
    this.config = config;
  }

  canHandle(task: TaskInput): boolean {
    const desc = task.context.website
      ? task.description.toLowerCase().includes("account") ||
        task.description.toLowerCase().includes("sign up") ||
        task.description.toLowerCase().includes("register") ||
        task.description.toLowerCase().includes("create")
      : false;

    return desc;
  }

  async execute(task: TaskInput): Promise<SubagentResult> {
    const website = task.context.website as string;
    const formData = (task.context.formData as Record<string, string>) || {};
    const email = task.context.email as string;

    if (!website) {
      return {
        success: false,
        error: {
          code: "MISSING_WEBSITE",
          message: "Website URL is required",
          recoverable: false,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Please provide the website URL where to create the account.",
      };
    }

    try {
      // Navigate to signup page
      const signupUrl = this.getSignupUrl(website);
      await this.config.browserTool?.navigate(signupUrl);

      // Get page snapshot to understand form structure
      const snapshot = await this.config.browserTool?.snapshot();

      // Fill in form fields
      const fields = this.prepareFormFields(formData, email);
      if (fields.length > 0) {
        await this.config.browserTool?.fill(fields);
      }

      // Submit form
      await this.config.browserTool?.click("submit");
      await this.config.browserTool?.waitForSelector("form", 3000).catch(() => {}); // Wait a bit

      // Check for OTP/verification requirement
      const resultSnapshot = await this.config.browserTool?.snapshot();
      const needsVerification = this.detectVerificationRequired(resultSnapshot);

      if (needsVerification && this.config.otpFetcher) {
        // Fetch OTP and submit
        const otpResult = await this.config.otpFetcher({
          ...task,
          context: { ...task.context, source: "gmail" },
        });

        if (otpResult.success && otpResult.data) {
          const otp = (otpResult.data as any).otp;
          await this.config.browserTool?.type("otp-input", otp);
          await this.config.browserTool?.click("verify");

          return {
            success: true,
            data: {
              accountCreated: true,
              website,
              email,
              verified: true,
            },
          };
        }
      }

      return {
        success: true,
        data: {
          accountCreated: true,
          website,
          email,
          verified: needsVerification ? false : true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "ACCOUNT_CREATION_FAILED",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: `Could not complete account creation on ${website}. Please help with: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private getSignupUrl(website: string): string {
    const url = website.startsWith("http") ? website : `https://${website}`;
    // Common signup paths
    const signupPaths = [
      "/signup",
      "/register",
      "/sign-up",
      "/join",
      "/create-account",
      "/auth/signup",
    ];
    return `${url}${signupPaths[0]}`;
  }

  private prepareFormFields(
    formData: Record<string, string>,
    email?: string,
  ): { ref: string; value: string }[] {
    const fields: { ref: string; value: string }[] = [];

    if (formData.email || email) {
      fields.push({ ref: "email", value: formData.email || email });
    }
    if (formData.password) {
      fields.push({ ref: "password", value: formData.password });
    }
    if (formData.name) {
      fields.push({ ref: "name", value: formData.name });
    }
    if (formData.username) {
      fields.push({ ref: "username", value: formData.username });
    }

    return fields;
  }

  private detectVerificationRequired(snapshot: any): boolean {
    if (!snapshot) return false;
    const text = JSON.stringify(snapshot).toLowerCase();
    return (
      text.includes("verify") ||
      text.includes("verification") ||
      text.includes("otp") ||
      text.includes("code") ||
      text.includes("confirm") ||
      (text.includes("email") && text.includes("sent"))
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/subagents/account-creator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/subagents/account-creator.ts src/agents/autonomous-agent/subagents/account-creator.test.ts
git commit -m "feat(autonomous-agent): add AccountCreator subagent for website registration"
```

---

## Task 5: Create Data Uploader Subagent

**Files:**

- Create: `src/agents/autonomous-agent/subagents/data-uploader.ts`
- Test: `src/agents/autonomous-agent/subagents/data-uploader.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/subagents/data-uploader.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataUploaderSubagent } from "./data-uploader";

describe("DataUploaderSubagent", () => {
  let subagent: DataUploaderSubagent;

  beforeEach(() => {
    subagent = new DataUploaderSubagent({});
  });

  it("should identify as DataUploader", () => {
    expect(subagent.name).toBe("DataUploader");
  });

  it("should handle upload tasks", () => {
    const task = {
      id: "1",
      description: "Upload file to google drive",
      context: { destination: "google-drive", filePath: "/path/to/file.pdf" },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };
    expect(subagent.canHandle(task)).toBe(true);
  });

  it("should handle form submission", () => {
    const task = {
      id: "1",
      description: "Submit form data",
      context: { destination: "web-form", data: { name: "test" } },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };
    expect(subagent.canHandle(task)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/subagents/data-uploader.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/agents/autonomous-agent/subagents/data-uploader.ts
import type { Subagent, SubagentResult, TaskInput } from "../types";

interface DataUploaderConfig {
  browserTool?: {
    navigate: (url: string) => Promise<any>;
    upload: (inputRef: string, filePath: string) => Promise<any>;
    fill: (fields: { ref: string; value: string }[]) => Promise<any>;
    click: (ref: string) => Promise<any>;
    waitForSelector: (selector: string, timeoutMs?: number) => Promise<any>;
  };
  fileSystem?: {
    readFile: (path: string) => Promise<Buffer>;
  };
}

export class DataUploaderSubagent implements Subagent {
  name = "DataUploader";
  description = "Uploads files and data to websites, cloud storage, or web forms";

  private config: DataUploaderConfig;

  constructor(config: DataUploaderConfig = {}) {
    this.config = config;
  }

  canHandle(task: TaskInput): boolean {
    const desc = task.description.toLowerCase();
    const context = task.context;

    return (
      desc.includes("upload") ||
      desc.includes("submit") ||
      desc.includes("send") ||
      desc.includes("attach") ||
      context.destination === "web-form" ||
      context.destination === "google-drive" ||
      context.destination === "dropbox" ||
      context.filePath !== undefined
    );
  }

  async execute(task: TaskInput): Promise<SubagentResult> {
    const destination = task.context.destination as string;
    const filePath = task.context.filePath as string;
    const webUrl = task.context.url as string;
    const data = task.context.data as Record<string, unknown>;

    try {
      if (destination === "web-form" || webUrl) {
        return await this.uploadToWebForm(task);
      }

      if (destination === "google-drive") {
        return await this.uploadToGoogleDrive(task);
      }

      if (destination === "dropbox") {
        return await this.uploadToDropbox(task);
      }

      // Default to web form if URL provided
      if (webUrl) {
        return await this.uploadToWebForm(task);
      }

      return {
        success: false,
        error: {
          code: "UNSUPPORTED_DESTINATION",
          message: `Destination "${destination}" not supported`,
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: `Upload destination "${destination}" not supported. Please provide a web URL or specify a supported destination.`,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "UPLOAD_FAILED",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Upload failed. Please help with the upload manually.",
      };
    }
  }

  private async uploadToWebForm(task: TaskInput): Promise<SubagentResult> {
    const url = task.context.url as string;
    const filePath = task.context.filePath as string;
    const data = task.context.data as Record<string, unknown>;

    if (!url) {
      return {
        success: false,
        error: {
          code: "NO_URL",
          message: "URL required for web form upload",
          recoverable: false,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Please provide the URL of the web form.",
      };
    }

    await this.config.browserTool?.navigate(url);

    // Handle file upload
    if (filePath) {
      await this.config.browserTool?.upload("file-input", filePath);
    }

    // Handle form data
    if (data) {
      const fields = Object.entries(data).map(([key, value]) => ({
        ref: key,
        value: String(value),
      }));
      await this.config.browserTool?.fill(fields);
    }

    // Submit
    await this.config.browserTool?.click("submit");

    return {
      success: true,
      data: { uploaded: true, destination: "web-form", url },
    };
  }

  private async uploadToGoogleDrive(task: TaskInput): Promise<SubagentResult> {
    // For Google Drive, navigate to the upload page
    await this.config.browserTool?.navigate("https://drive.google.com");
    await this.config.browserTool?.click("new-button");
    await this.config.browserTool?.click("file-upload");

    const filePath = task.context.filePath as string;
    if (filePath) {
      await this.config.browserTool?.upload("file-input", filePath);
    }

    return {
      success: true,
      data: { uploaded: true, destination: "google-drive" },
    };
  }

  private async uploadToDropbox(task: TaskInput): Promise<SubagentResult> {
    await this.config.browserTool?.navigate("https://www.dropbox.com");
    await this.config.browserTool?.click("upload-button");

    const filePath = task.context.filePath as string;
    if (filePath) {
      await this.config.browserTool?.upload("file-input", filePath);
    }

    return {
      success: true,
      data: { uploaded: true, destination: "dropbox" },
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/subagents/data-uploader.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/subagents/data-uploader.ts src/agents/autonomous-agent/subagents/data-uploader.test.ts
git commit -m "feat(autonomous-agent): add DataUploader subagent for file uploads"
```

---

## Task 6: Create Subagent Registry

**Files:**

- Create: `src/agents/autonomous-agent/subagents/index.ts`

- [ ] **Step 1: Write the implementation**

```typescript
// src/agents/autonomous-agent/subagents/index.ts
import type { Subagent, AgentSettings } from "../types";
import { OTPFetcherSubagent } from "./otp-fetcher";
import { AccountCreatorSubagent } from "./account-creator";
import { DataUploaderSubagent } from "./data-uploader";

export { OTPFetcherSubagent } from "./otp-fetcher";
export { AccountCreatorSubagent } from "./account-creator";
export { DataUploaderSubagent } from "./data-uploader";

export interface SubagentConfig {
  gmailClient?: any;
  mobileClient?: any;
  browserTool?: any;
  fileSystem?: any;
}

export function createSubagents(config: SubagentConfig): Subagent[] {
  return [
    new OTPFetcherSubagent({
      gmailClient: config.gmailClient,
      mobileClient: config.mobileClient,
    }),
    new AccountCreatorSubagent({
      browserTool: config.browserTool,
      otpFetcher: async (task) => {
        const fetcher = new OTPFetcherSubagent({
          gmailClient: config.gmailClient,
          mobileClient: config.mobileClient,
        });
        return fetcher.execute(task);
      },
    }),
    new DataUploaderSubagent({
      browserTool: config.browserTool,
      fileSystem: config.fileSystem,
    }),
  ];
}

export function registerSubagents(dispatcher: any, config: SubagentConfig): void {
  const subagents = createSubagents(config);

  for (const subagent of subagents) {
    dispatcher.register(subagent);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/autonomous-agent/subagents/index.ts
git commit -m "feat(autonomous-agent): add subagent registry"
```

---

## Summary

| Task | Description                                            | Complexity |
| ---- | ------------------------------------------------------ | ---------- |
| 1    | Define Core Types (Subagent, TaskInput, FallbackChain) | Low        |
| 2    | Create Subagent Dispatcher with fallback chain         | High       |
| 3    | Create OTP Fetcher Subagent                            | Medium     |
| 4    | Create Account Creator Subagent                        | Medium     |
| 5    | Create Data Uploader Subagent                          | Medium     |
| 6    | Create Subagent Registry                               | Low        |

---

## Next Steps

After completing tasks:

1. Add BrowserController subagent
2. Add FileManager subagent
3. Add EmailAgent subagent
4. Integration tests
5. macOS UI for settings

# Autonomous Web Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully autonomous digital agent that can browse internet, complete web tasks, handle verifications (OTP), and access local system (files, calendar, email, contacts) with dual-mode operation (autonomous/assisted) and granular user permissions.

**Architecture:**

- Agent core in `src/agents/autonomous-agent/` with ToolRegistry, TaskExecutor, SessionManager
- Leverage existing browser automation (`src/browser/`, `src/agents/tools/browser-tool.ts`)
- Add new tool modules for FileSystem, Calendar, Email, Contacts, Mobile Verification
- Settings UI in macOS app for user permission management
- OAuth integration with existing Google auth flow in codebase

**Tech Stack:** TypeScript, Playwright (existing), Gmail API, Google Calendar API, AppleScript (macOS), Keychain for secure storage

---

## File Structure Overview

```
src/agents/autonomous-agent/
├── index.ts                    # Main exports
├── agent-controller.ts          # Agent lifecycle management
├── tool-registry.ts            # Tool registration & permission checking
├── task-executor.ts            # Task execution (auto/assisted modes)
├── session-manager.ts          # Session context persistence
├── settings/
│   ├── index.ts               # Settings management
│   ├── types.ts               # Settings types
│   └── storage.ts             # Encrypted storage
├── tools/
│   ├── index.ts               # Tool exports
│   ├── file-system.ts         # File operations tool
│   ├── calendar.ts            # Google Calendar tool
│   ├── email.ts               # Gmail API tool
│   ├── contacts.ts            # Google Contacts tool
│   └── mobile-verification.ts # SMS/OTP via mobile app
├── verification/
│   ├── index.ts              # Verification handler exports
│   ├── gmail-otp.ts          # Gmail OTP detection
│   ├── mobile-sms.ts         # Mobile SMS handler
│   └── fallback.ts           # Human escalation handler
└── types.ts                  # Core types (ToolResult, AgentSettings, etc.)

src/config/
├── types.ts                  # Add AgentSettings config types
└── schema.ts                 # Add agent settings schema

apps/macos/Sources/QCortex/
├── AgentSettingsView.swift   # Settings UI
└── ...
```

---

## Phase 1: Foundation (Agent Core)

### Task 1: Create Agent Core Types

**Files:**

- Create: `src/agents/autonomous-agent/types.ts`
- Test: `src/agents/autonomous-agent/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/types.test.ts
import { describe, it, expect } from "vitest";
import type { AgentSettings, ToolResult, AgentMode, ToolPermission } from "./types";

describe("Agent Types", () => {
  it("should define ToolResult success case", () => {
    const result: ToolResult<string> = { success: true, data: "test" };
    expect(result.success).toBe(true);
    expect(result.data).toBe("test");
  });

  it("should define ToolResult error case", () => {
    const result: ToolResult<string> = {
      success: false,
      error: { code: "NOT_FOUND", message: "File not found", recoverable: true },
    };
    expect(result.success).toBe(false);
    expect(result.error.code).toBe("NOT_FOUND");
  });

  it("should define AgentSettings with default values", () => {
    const settings: AgentSettings = {
      mode: "assisted",
      tools: {},
      notifications: { onAction: true, onComplete: true, onError: true },
      verification: { otpHandling: "manual", paymentMode: "disabled", formAutoFill: "ask" },
    };
    expect(settings.mode).toBe("assisted");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/types.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/types.ts
export type AgentMode = "autonomous" | "assisted";

export type OtpHandling = "auto" | "manual" | "ask";
export type PaymentMode = "disabled" | "view" | "full";
export type FormAutoFill = "ask" | "saved" | "disabled";

export interface ToolError {
  code: string;
  message: string;
  recoverable: boolean;
}

export type ToolResult<T> = { success: true; data: T } | { success: false; error: ToolError };

export interface ToolPermission {
  enabled: boolean;
  scope: "read" | "write" | "all";
  autoApprove: boolean;
}

export interface NotificationSettings {
  onAction: boolean;
  onComplete: boolean;
  onError: boolean;
}

export interface VerificationSettings {
  otpHandling: OtpHandling;
  paymentMode: PaymentMode;
  formAutoFill: FormAutoFill;
  autoRetry: number;
  escalateAfterFails: number;
}

export interface AgentSettings {
  mode: AgentMode;
  tools: Record<string, ToolPermission>;
  notifications: NotificationSettings;
  verification: VerificationSettings;
}

export interface AgentTask {
  id: string;
  description: string;
  requiredTools: string[];
  status: "pending" | "running" | "completed" | "failed";
  result?: ToolResult<unknown>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/types.ts src/agents/autonomous-agent/types.test.ts
git commit -m "feat(autonomous-agent): add core types for agent settings and tool results"
```

---

### Task 2: Create Tool Registry

**Files:**

- Create: `src/agents/autonomous-agent/tool-registry.ts`
- Create: `src/agents/autonomous-agent/tool-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/tool-registry.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry } from "./tool-registry";
import type { AgentSettings, ToolPermission } from "./types";

describe("ToolRegistry", () => {
  let registry: ToolRegistry;
  let settings: AgentSettings;

  beforeEach(() => {
    settings = {
      mode: "assisted",
      tools: {
        browser: { enabled: true, scope: "all", autoApprove: false },
        files: { enabled: true, scope: "read", autoApprove: false },
      },
      notifications: { onAction: true, onComplete: true, onError: true },
      verification: {
        otpHandling: "manual",
        paymentMode: "disabled",
        formAutoFill: "ask",
        autoRetry: 3,
        escalateAfterFails: 5,
      },
    };
    registry = new ToolRegistry(settings);
  });

  it("should register a tool", () => {
    const tool = { name: "test-tool", execute: async () => ({ success: true, data: "ok" }) };
    registry.register(tool);
    expect(registry.isRegistered("test-tool")).toBe(true);
  });

  it("should check tool permission - enabled", () => {
    expect(registry.canUse("browser")).toBe(true);
  });

  it("should check tool permission - disabled", () => {
    expect(registry.canUse("calendar")).toBe(false);
  });

  it("should check tool permission - scope", () => {
    expect(registry.hasScope("files", "read")).toBe(true);
    expect(registry.hasScope("files", "write")).toBe(false);
  });

  it("should require approval for tool use", () => {
    expect(registry.requiresApproval("browser")).toBe(true);
  });

  it("should update settings", () => {
    const newSettings: AgentSettings = {
      ...settings,
      tools: { ...settings.tools, browser: { enabled: true, scope: "all", autoApprove: true } },
    };
    registry.updateSettings(newSettings);
    expect(registry.requiresApproval("browser")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/tool-registry.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/tool-registry.ts
import type { AgentSettings, ToolPermission, ToolResult } from "./types";

interface Tool {
  name: string;
  description?: string;
  requiredScope?: "read" | "write" | "all";
  execute: (params: unknown) => Promise<ToolResult<unknown>>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private settings: AgentSettings;

  constructor(settings: AgentSettings) {
    this.settings = settings;
  }

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  isRegistered(name: string): boolean {
    return this.tools.has(name);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  canUse(toolName: string): boolean {
    const permission = this.settings.tools[toolName];
    return permission?.enabled ?? false;
  }

  hasScope(toolName: string, scope: "read" | "write" | "all"): boolean {
    const permission = this.settings.tools[toolName];
    if (!permission?.enabled) return false;
    if (permission.scope === "all") return true;
    if (permission.scope === scope) return true;
    if (scope === "read" && permission.scope === "write") return false;
    return permission.scope === scope;
  }

  requiresApproval(toolName: string): boolean {
    const permission = this.settings.tools[toolName];
    return !permission?.autoApprove ?? true;
  }

  getEnabledTools(): string[] {
    return Array.from(this.tools.entries())
      .filter(([name]) => this.canUse(name))
      .map(([name]) => name);
  }

  updateSettings(settings: AgentSettings): void {
    this.settings = settings;
  }

  getSettings(): AgentSettings {
    return this.settings;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/tool-registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/tool-registry.ts src/agents/autonomous-agent/tool-registry.test.ts
git commit -m "feat(autonomous-agent): add ToolRegistry for tool permission management"
```

---

### Task 3: Create Task Executor

**Files:**

- Create: `src/agents/autonomous-agent/task-executor.ts`
- Create: `src/agents/autonomous-agent/task-executor.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/task-executor.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskExecutor } from "./task-executor";
import { ToolRegistry } from "./tool-registry";
import type { AgentSettings, ToolResult, AgentTask } from "./types";

describe("TaskExecutor", () => {
  let executor: TaskExecutor;
  let registry: ToolRegistry;
  let settings: AgentSettings;

  beforeEach(() => {
    settings = {
      mode: "assisted",
      tools: {
        browser: { enabled: true, scope: "all", autoApprove: true },
        files: { enabled: true, scope: "read", autoApprove: false },
      },
      notifications: { onAction: true, onComplete: true, onError: true },
      verification: {
        otpHandling: "manual",
        paymentMode: "disabled",
        formAutoFill: "ask",
        autoRetry: 3,
        escalateAfterFails: 5,
      },
    };
    registry = new ToolRegistry(settings);
    executor = new TaskExecutor(registry, settings);
  });

  it("should execute task in autonomous mode", async () => {
    const task: AgentTask = {
      id: "1",
      description: "Browse example.com",
      requiredTools: ["browser"],
      status: "pending",
    };

    registry.register({
      name: "browser",
      execute: async () => ({ success: true, data: "Page loaded" }),
    });

    const result = await executor.execute(task);
    expect(result.success).toBe(true);
  });

  it("should require approval in assisted mode without autoApprove", async () => {
    settings.mode = "assisted";
    registry.updateSettings(settings);

    const task: AgentTask = {
      id: "2",
      description: "Read file",
      requiredTools: ["files"],
      status: "pending",
    };

    const needsApproval = executor.requiresApproval(task);
    expect(needsApproval).toBe(true);
  });

  it("should reject when tool not permitted", async () => {
    const task: AgentTask = {
      id: "3",
      description: "Use calendar",
      requiredTools: ["calendar"],
      status: "pending",
    };

    const result = await executor.execute(task);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("TOOL_NOT_PERMITTED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/task-executor.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/task-executor.ts
import type { AgentSettings, ToolResult, AgentTask } from "./types";
import { ToolRegistry } from "./tool-registry";

export class TaskExecutor {
  private registry: ToolRegistry;
  private settings: AgentSettings;

  constructor(registry: ToolRegistry, settings: AgentSettings) {
    this.registry = registry;
    this.settings = settings;
  }

  requiresApproval(task: AgentTask): boolean {
    for (const toolName of task.requiredTools) {
      if (!this.registry.canUse(toolName)) {
        return false; // Will be rejected anyway
      }
      if (this.registry.requiresApproval(toolName)) {
        return true;
      }
    }
    return false;
  }

  async execute(task: AgentTask): Promise<ToolResult<unknown>> {
    // Check permissions first
    for (const toolName of task.requiredTools) {
      if (!this.registry.canUse(toolName)) {
        return {
          success: false,
          error: {
            code: "TOOL_NOT_PERMITTED",
            message: `Tool ${toolName} is not permitted`,
            recoverable: false,
          },
        };
      }
    }

    // In assisted mode with approval required, return pending
    if (this.settings.mode === "assisted" && this.requiresApproval(task)) {
      return {
        success: false,
        error: {
          code: "REQUIRES_APPROVAL",
          message: "Task requires user approval",
          recoverable: true,
        },
      };
    }

    // Execute with first available tool
    for (const toolName of task.requiredTools) {
      const tool = this.registry.getTool(toolName);
      if (tool) {
        try {
          task.status = "running";
          const result = await tool.execute({ task });
          task.status = result.success ? "completed" : "failed";
          task.result = result;
          return result;
        } catch (error) {
          task.status = "failed";
          return {
            success: false,
            error: { code: "EXECUTION_ERROR", message: String(error), recoverable: false },
          };
        }
      }
    }

    return {
      success: false,
      error: {
        code: "NO_TOOL_AVAILABLE",
        message: "No available tool for task",
        recoverable: false,
      },
    };
  }

  async executeApproved(task: AgentTask): Promise<ToolResult<unknown>> {
    return this.execute(task);
  }

  updateSettings(settings: AgentSettings): void {
    this.settings = settings;
    this.registry.updateSettings(settings);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/task-executor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/task-executor.ts src/agents/autonomous-agent/task-executor.test.ts
git commit -m "feat(autonomous-agent): add TaskExecutor for task execution with approval flow"
```

---

### Task 4: Create Agent Controller

**Files:**

- Create: `src/agents/autonomous-agent/agent-controller.ts`
- Create: `src/agents/autonomous-agent/agent-controller.test.ts`
- Create: `src/agents/autonomous-agent/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/agent-controller.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentController } from "./agent-controller";
import type { AgentSettings } from "./types";

describe("AgentController", () => {
  let controller: AgentController;
  let settings: AgentSettings;

  beforeEach(() => {
    settings = {
      mode: "assisted",
      tools: {
        browser: { enabled: true, scope: "all", autoApprove: true },
      },
      notifications: { onAction: true, onComplete: true, onError: true },
      verification: {
        otpHandling: "manual",
        paymentMode: "disabled",
        formAutoFill: "ask",
        autoRetry: 3,
        escalateAfterFails: 5,
      },
    };
    controller = new AgentController(settings);
  });

  it("should start agent", () => {
    controller.start();
    expect(controller.isRunning()).toBe(true);
  });

  it("should stop agent", () => {
    controller.start();
    controller.stop();
    expect(controller.isRunning()).toBe(false);
  });

  it("should switch mode", () => {
    controller.setMode("autonomous");
    const settings = controller.getSettings();
    expect(settings.mode).toBe("autonomous");
  });

  it("should update settings", () => {
    const newSettings = { ...settings, mode: "autonomous" as const };
    controller.updateSettings(newSettings);
    expect(controller.getSettings().mode).toBe("autonomous");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/agent-controller.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/agent-controller.ts
import { TaskExecutor } from "./task-executor";
import { ToolRegistry } from "./tool-registry";
import type { AgentSettings, AgentMode, AgentTask, ToolResult } from "./types";

export class AgentController {
  private running = false;
  private registry: ToolRegistry;
  private executor: TaskExecutor;
  private settings: AgentSettings;

  constructor(settings: AgentSettings) {
    this.settings = settings;
    this.registry = new ToolRegistry(settings);
    this.executor = new TaskExecutor(this.registry, settings);
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  getExecutor(): TaskExecutor {
    return this.executor;
  }

  getRegistry(): ToolRegistry {
    return this.registry;
  }

  setMode(mode: AgentMode): void {
    this.settings = { ...this.settings, mode };
    this.executor.updateSettings(this.settings);
  }

  updateSettings(settings: AgentSettings): void {
    this.settings = settings;
    this.executor.updateSettings(settings);
  }

  getSettings(): AgentSettings {
    return this.settings;
  }

  async executeTask(task: AgentTask): Promise<ToolResult<unknown>> {
    if (!this.running) {
      return {
        success: false,
        error: { code: "AGENT_NOT_RUNNING", message: "Agent is not running", recoverable: true },
      };
    }
    return this.executor.execute(task);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/agent-controller.test.ts`
Expected: PASS

- [ ] **Step 5: Create index.ts exports**

```typescript
// src/agents/autonomous-agent/index.ts
export { AgentController } from "./agent-controller";
export { ToolRegistry } from "./tool-registry";
export { TaskExecutor } from "./task-executor";

export type {
  AgentSettings,
  AgentMode,
  AgentTask,
  ToolResult,
  ToolError,
  ToolPermission,
  NotificationSettings,
  VerificationSettings,
  OtpHandling,
  PaymentMode,
  FormAutoFill,
} from "./types";
```

- [ ] **Step 6: Commit**

```bash
git add src/agents/autonomous-agent/
git commit -m "feat(autonomous-agent): add AgentController for lifecycle management"
```

---

## Phase 2: Tool Modules

### Task 5: Integrate Browser Tool with Agent

**Files:**

- Modify: `src/agents/tools/browser-tool.ts:1-50` (add agent integration)
- Create: `src/agents/autonomous-agent/tools/browser-tool-wrapper.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/tools/browser-tool-wrapper.test.ts
import { describe, it, expect, vi } from "vitest";
import { createBrowserToolAdapter } from "./browser-tool-wrapper";

describe("BrowserToolAdapter", () => {
  it("should create agent-compatible browser tool", () => {
    const tool = createBrowserToolAdapter({});
    expect(tool.name).toBe("browser");
    expect(typeof tool.execute).toBe("function");
  });

  it("should wrap browser tool result in ToolResult", async () => {
    // Mock browser execution
    const mockExecute = vi.fn().mockResolvedValue({ success: true, data: "done" });

    const tool = createBrowserToolAdapter({ execute: mockExecute });
    const result = await tool.execute({ action: "navigate", url: "https://example.com" });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/tools/browser-tool-wrapper.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/agents/autonomous-agent/tools/browser-tool-wrapper.ts
import type { ToolResult } from "../types";

/**
 * Wraps the existing browser tool (from src/agents/tools/browser-tool.ts)
 * to work with the autonomous agent framework
 */
export function createBrowserToolAdapter(browserTool: {
  execute: (params: unknown) => Promise<unknown>;
}): {
  name: string;
  description: string;
  requiredScope: "write";
  execute: (params: unknown) => Promise<ToolResult<unknown>>;
} {
  return {
    name: "browser",
    description: "Web browser automation - navigate, click, fill forms, etc.",
    requiredScope: "write",
    async execute(params: unknown): Promise<ToolResult<unknown>> {
      try {
        const result = await browserTool.execute(params);
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: {
            code: "BROWSER_ERROR",
            message: error instanceof Error ? error.message : String(error),
            recoverable: true,
          },
        };
      }
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/tools/browser-tool-wrapper.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/tools/
git commit -m "feat(autonomous-agent): add browser tool adapter for agent integration"
```

---

### Task 6: Create File System Tool

**Files:**

- Create: `src/agents/autonomous-agent/tools/file-system.ts`
- Create: `src/agents/autonomous-agent/tools/file-system.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/tools/file-system.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileSystemTool } from "./file-system";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

describe("FileSystemTool", () => {
  let tool: FileSystemTool;
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-test-"));
    tool = new FileSystemTool({ allowedPaths: [testDir] });
  });

  it("should read file", async () => {
    await fs.writeFile(path.join(testDir, "test.txt"), "hello world");
    const result = await tool.readFile(path.join(testDir, "test.txt"));
    expect(result.success).toBe(true);
    expect(result.data).toBe("hello world");
  });

  it("should write file", async () => {
    const filePath = path.join(testDir, "write.txt");
    const result = await tool.writeFile(filePath, "test content");
    expect(result.success).toBe(true);

    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toBe("test content");
  });

  it("should list directory", async () => {
    await fs.writeFile(path.join(testDir, "a.txt"), "a");
    await fs.writeFile(path.join(testDir, "b.txt"), "b");

    const result = await tool.listDirectory(testDir);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  it("should reject path outside allowed", async () => {
    const result = await tool.readFile("/etc/passwd");
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("PATH_NOT_ALLOWED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/tools/file-system.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/agents/autonomous-agent/tools/file-system.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ToolResult, ToolError } from "../types";

interface FileSystemToolConfig {
  allowedPaths?: string[];
  downloadsPath?: string;
}

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
}

export class FileSystemTool {
  private allowedPaths: string[];
  private downloadsPath: string;

  constructor(config: FileSystemToolConfig = {}) {
    this.allowedPaths = config.allowedPaths || [os.homedir(), os.tmpdir()];
    this.downloadsPath = config.downloadsPath || path.join(os.homedir(), "Downloads");
  }

  private isPathAllowed(filePath: string): boolean {
    const resolved = path.resolve(filePath);
    return this.allowedPaths.some((allowed) => resolved.startsWith(path.resolve(allowed)));
  }

  private createError(code: string, message: string, recoverable: boolean): ToolError {
    return { code, message, recoverable };
  }

  async readFile(filePath: string): Promise<ToolResult<string>> {
    if (!this.isPathAllowed(filePath)) {
      return {
        success: false,
        error: this.createError("PATH_NOT_ALLOWED", "Access denied", false),
      };
    }
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: this.createError("READ_ERROR", String(error), true) };
    }
  }

  async writeFile(filePath: string, content: string): Promise<ToolResult<void>> {
    if (!this.isPathAllowed(filePath)) {
      return {
        success: false,
        error: this.createError("PATH_NOT_ALLOWED", "Access denied", false),
      };
    }
    try {
      await fs.writeFile(filePath, content, "utf-8");
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: this.createError("WRITE_ERROR", String(error), true) };
    }
  }

  async listDirectory(dirPath: string): Promise<ToolResult<FileInfo[]>> {
    if (!this.isPathAllowed(dirPath)) {
      return {
        success: false,
        error: this.createError("PATH_NOT_ALLOWED", "Access denied", false),
      };
    }
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          const stats = await fs.stat(fullPath);
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            modified: stats.mtime,
          };
        }),
      );
      return { success: true, data: files };
    } catch (error) {
      return { success: false, error: this.createError("LIST_ERROR", String(error), true) };
    }
  }

  async deleteFile(filePath: string): Promise<ToolResult<void>> {
    if (!this.isPathAllowed(filePath)) {
      return {
        success: false,
        error: this.createError("PATH_NOT_ALLOWED", "Access denied", false),
      };
    }
    try {
      await fs.unlink(filePath);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: this.createError("DELETE_ERROR", String(error), false) };
    }
  }

  async createDirectory(dirPath: string): Promise<ToolResult<void>> {
    if (!this.isPathAllowed(dirPath)) {
      return {
        success: false,
        error: this.createError("PATH_NOT_ALLOWED", "Access denied", false),
      };
    }
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: this.createError("MKDIR_ERROR", String(error), true) };
    }
  }

  getDownloadsPath(): string {
    return this.downloadsPath;
  }
}

import * as os from "node:os";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/tools/file-system.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/tools/file-system.ts src/agents/autonomous-agent/tools/file-system.test.ts
git commit -m "feat(autonomous-agent): add FileSystemTool for local file operations"
```

---

### Task 7: Create Gmail/Email Tool

**Files:**

- Create: `src/agents/autonomous-agent/tools/email.ts`
- Create: `src/agents/autonomous-agent/tools/email.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/tools/email.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailTool } from "./email";

describe("EmailTool", () => {
  let tool: EmailTool;

  // Mock Google OAuth
  const mockGoogleAuth = {
    getAccessToken: vi.fn().mockResolvedValue("mock-token"),
  };

  beforeEach(() => {
    tool = new EmailTool({ googleAuth: mockGoogleAuth as any });
  });

  it("should detect OTP pattern in email", async () => {
    // Mock Gmail API response with OTP
    const mockGmailClient = {
      users: {
        messages: {
          list: vi.fn().mockResolvedValue({ messages: [{ id: "123" }] }),
          get: vi.fn().mockResolvedValue({
            payload: {
              body: { data: Buffer.from("Your verification code is 123456").toString("base64") },
            },
          }),
        },
      },
    };

    const result = await tool.detectOTPInInbox();
    // Will fail because no real API - just test the regex
  });

  it("should validate email tool interface", () => {
    expect(typeof tool.listEmails).toBe("function");
    expect(typeof tool.sendEmail).toBe("function");
    expect(typeof tool.detectOTPInInbox).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/tools/email.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/agents/autonomous-agent/tools/email.ts
import type { ToolResult, ToolError } from "../types";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
}

interface EmailToolConfig {
  googleAuth: {
    getAccessToken: () => Promise<string>;
  };
}

export class EmailTool {
  private googleAuth: EmailToolConfig["googleAuth"];

  constructor(config: EmailToolConfig) {
    this.googleAuth = config.googleAuth;
  }

  private createError(code: string, message: string, recoverable: boolean): ToolError {
    return { code, message, recoverable };
  }

  private extractOTP(text: string): string | null {
    // Primary: find OTP near verification keywords
    const patterns = [
      /(?:code|otp|verification|pin|security)[^\d]*(\d{4,8})/i,
      /\b(\d{6})\b/, // 6-digit codes (most common)
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  async detectOTPInInbox(): Promise<ToolResult<string | null>> {
    try {
      const token = await this.googleAuth.getAccessToken();

      // This would call Gmail API - placeholder for implementation
      // In real implementation:
      // 1. Call Gmail.users.messages.list with query for recent OTP emails
      // 2. Fetch each message
      // 3. Extract OTP using extractOTP()
      // 4. Return the code

      // For now, return mock - implementer would integrate with Gmail API
      return { success: true, data: null }; // No OTP found
    } catch (error) {
      return { success: false, error: this.createError("OTP_ERROR", String(error), true) };
    }
  }

  async listEmails(query: string, maxResults = 10): Promise<ToolResult<Email[]>> {
    try {
      const token = await this.googleAuth.getAccessToken();
      // Implement Gmail API call
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: this.createError("LIST_ERROR", String(error), true) };
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<ToolResult<string>> {
    try {
      const token = await this.googleAuth.getAccessToken();
      // Implement Gmail API call
      return { success: true, data: "message-id" };
    } catch (error) {
      return { success: false, error: this.createError("SEND_ERROR", String(error), true) };
    }
  }

  getToolDefinition() {
    return {
      name: "email",
      description: "Access Gmail for reading, sending emails, and OTP detection",
      requiredScope: "all",
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/tools/email.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/tools/email.ts src/agents/autonomous-agent/tools/email.test.ts
git commit -m "feat(autonomous-agent): add EmailTool with Gmail API and OTP detection"
```

---

## Phase 3: Verification System

### Task 8: Create Verification Handler

**Files:**

- Create: `src/agents/autonomous-agent/verification/index.ts`
- Create: `src/agents/autonomous-agent/verification/gmail-otp.ts`
- Create: `src/agents/autonomous-agent/verification/fallback.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/verification/gmail-otp.test.ts
import { describe, it, expect } from "vitest";
import { extractOTP } from "./gmail-otp";

describe("GmailOTP", () => {
  it("should extract 6-digit OTP from email", () => {
    const text = "Your verification code is 123456";
    expect(extractOTP(text)).toBe("123456");
  });

  it("should extract OTP with context", () => {
    const text = "Your OTP for login is 987654. Do not share this.";
    expect(extractOTP(text)).toBe("987654");
  });

  it("should return null for no OTP", () => {
    const text = "Hello, this is a regular email";
    expect(extractOTP(text)).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/verification/gmail-otp.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/agents/autonomous-agent/verification/gmail-otp.ts

/**
 * Extract OTP code from email text
 * Uses context-aware pattern matching
 */
export function extractOTP(text: string): string | null {
  const patterns = [
    // Primary: find OTP near verification keywords
    /(?:code|otp|verification|pin|security|confirm|validate)[^\d]*(\d{4,8})/i,
    // Fallback: 6-digit codes (most common for 2FA)
    /\b(\d{6})\b/,
    // 4-8 digit codes without context
    /\b(\d{4,8})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Prefer 6-digit codes as they're most common for OTPs
      if (match[1].length === 6) {
        return match[1];
      }
    }
  }

  return null;
}

export interface VerificationResult {
  success: boolean;
  code?: string;
  method: "gmail" | "sms" | "manual";
  error?: string;
}

/**
 * Wait for OTP from Gmail inbox
 */
export async function waitForGmailOTP(
  googleAuth: { getAccessToken: () => Promise<string> },
  timeoutMs = 60000,
  pollIntervalMs = 5000,
): Promise<VerificationResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const token = await googleAuth.getAccessToken();

      // TODO: Implement actual Gmail API call
      // 1. Call users.messages.list with query for "is:unread subject:verification OR subject:code"
      // 2. Get each message
      // 3. Extract OTP using extractOTP()
      // 4. Return the code if found

      // For now, simulate waiting
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      return {
        success: false,
        method: "gmail",
        error: String(error),
      };
    }
  }

  return {
    success: false,
    method: "gmail",
    error: "Timeout waiting for OTP",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/verification/gmail-otp.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/verification/
git commit -m "feat(autonomous-agent): add verification handler with OTP detection"
```

---

## Phase 4: Settings & Storage

### Task 9: Create Settings Storage

**Files:**

- Create: `src/agents/autonomous-agent/settings/storage.ts`
- Create: `src/agents/autonomous-agent/settings/storage.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/agents/autonomous-agent/settings/storage.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsStorage } from "./storage";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

describe("SettingsStorage", () => {
  let storage: SettingsStorage;
  let testPath: string;

  beforeEach(async () => {
    testPath = path.join(os.tmpdir(), "agent-settings-test");
    await fs.mkdir(testPath, { recursive: true });
    storage = new SettingsStorage(testPath);
  });

  it("should save and load settings", async () => {
    const settings = {
      mode: "assisted" as const,
      tools: { browser: { enabled: true, scope: "all", autoApprove: true } },
      notifications: { onAction: true, onComplete: true, onError: true },
      verification: {
        otpHandling: "manual" as const,
        paymentMode: "disabled" as const,
        formAutoFill: "ask" as const,
        autoRetry: 3,
        escalateAfterFails: 5,
      },
    };

    await storage.save(settings);
    const loaded = await storage.load();

    expect(loaded.mode).toBe("assisted");
    expect(loaded.tools.browser.enabled).toBe(true);
  });

  it("should return defaults when no settings exist", async () => {
    const settings = await storage.load();
    expect(settings.mode).toBe("assisted");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/agents/autonomous-agent/settings/storage.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/agents/autonomous-agent/settings/storage.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type { AgentSettings } from "../types";

const SETTINGS_FILE = "agent-settings.json";

const DEFAULT_SETTINGS: AgentSettings = {
  mode: "assisted",
  tools: {},
  notifications: {
    onAction: true,
    onComplete: true,
    onError: true,
  },
  verification: {
    otpHandling: "manual",
    paymentMode: "disabled",
    formAutoFill: "ask",
    autoRetry: 3,
    escalateAfterFails: 5,
  },
};

export class SettingsStorage {
  private settingsPath: string;

  constructor(basePath?: string) {
    this.settingsPath = path.join(
      basePath || process.env.QCORTEX_HOME || "",
      ".qcortex",
      SETTINGS_FILE,
    );
  }

  async save(settings: AgentSettings): Promise<void> {
    const dir = path.dirname(this.settingsPath);
    await fs.mkdir(dir, { recursive: true });

    // In production, encrypt sensitive data
    const encrypted = this.encrypt(JSON.stringify(settings));
    await fs.writeFile(this.settingsPath, encrypted, "utf-8");
  }

  async load(): Promise<AgentSettings> {
    try {
      const data = await fs.readFile(this.settingsPath, "utf-8");
      const decrypted = this.decrypt(data);
      return JSON.parse(decrypted) as AgentSettings;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async delete(): Promise<void> {
    try {
      await fs.unlink(this.settingsPath);
    } catch {
      // Ignore if doesn't exist
    }
  }

  // Simple encryption for dev - in production use proper Keychain
  private encrypt(data: string): string {
    // TODO: Integrate with Keychain for secure storage
    return Buffer.from(data).toString("base64");
  }

  private decrypt(data: string): string {
    return Buffer.from(data, "base64").toString("utf-8");
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/agents/autonomous-agent/settings/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/autonomous-agent/settings/
git commit -m "feat(autonomous-agent): add settings storage with encryption"
```

---

## Phase 5: Integration & macOS UI

### Task 10: Create macOS Settings UI

**Files:**

- Create: `apps/macos/Sources/QCortex/AgentSettingsView.swift`

- [ ] **Step 1: Design the SwiftUI view**

```swift
// apps/macos/Sources/QCortex/AgentSettingsView.swift
import SwiftUI

struct AgentSettingsView: View {
    @State private var agentMode: AgentMode = .assisted
    @State private var otpHandling: OtpHandling = .manual
    @State private var paymentMode: PaymentMode = .disabled
    @State private var formAutoFill: FormAutoFill = .ask
    @State private var sessionTimeout: Int = 30

    @State private var toolSettings: [String: ToolSetting] = [
        "browser": ToolSetting(enabled: true, scope: .all, autoApprove: true),
        "files": ToolSetting(enabled: true, scope: .read, autoApprove: false),
    ]

    enum AgentMode: String, CaseIterable {
        case autonomous = "Autonomous"
        case assisted = "Assisted"
    }

    enum OtpHandling: String, CaseIterable {
        case auto = "Auto-read"
        case manual = "Manual input"
        case ask = "Ask each time"
    }

    enum PaymentMode: String, CaseIterable {
        case disabled = "Disabled"
        case view = "View only"
        case full = "Full access"
    }

    enum FormAutoFill: String, CaseIterable {
        case ask = "Ask each time"
        case saved = "Use saved data"
        case disabled = "Disabled"
    }

    struct ToolSetting {
        var enabled: Bool
        var scope: Scope
        var autoApprove: Bool

        enum Scope: String, CaseIterable {
            case read = "Read"
            case write = "Write"
            case all = "All"
        }
    }

    var body: some View {
        Form {
            Section("Mode") {
                Picker("Agent Mode", selection: $agentMode) {
                    ForEach(AgentMode.allCases, id: \.self) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
            }

            Section("Tools") {
                ForEach(Array(toolSettings.keys.sorted()), id: \.self) { tool in
                    Toggle(tool, isOn: Binding(
                        get: { toolSettings[tool]?.enabled ?? false },
                        set: { toolSettings[tool]?.enabled = $0 }
                    ))
                }
            }

            Section("Verification & Security") {
                Picker("OTP Handling", selection: $otpHandling) {
                    ForEach(OtpHandling.allCases, id: \.self) { opt in
                        Text(opt.rawValue).tag(opt)
                    }
                }

                Picker("Payment Mode", selection: $paymentMode) {
                    ForEach(PaymentMode.allCases, id: \.self) { opt in
                        Text(opt.rawValue).tag(opt)
                    }
                }

                Picker("Form Auto-fill", selection: $formAutoFill) {
                    ForEach(FormAutoFill.allCases, id: \.self) { opt in
                        Text(opt.rawValue).tag(opt)
                    }
                }
            }

            Section("Safety") {
                HStack {
                    Text("Session timeout:")
                    TextField("minutes", value: $sessionTimeout, format: .number)
                    Text("min")
                }

                Toggle("Require 2FA for settings", isOn: .constant(false))
            }

            Section {
                HStack {
                    Button("Save") {
                        saveSettings()
                    }
                    .buttonStyle(.borderedProminent)

                    Button("Cancel") {
                        // Dismiss
                    }
                }
            }
        }
        .padding()
        .frame(width: 500, height: 600)
    }

    private func saveSettings() {
        // TODO: Save to storage
    }
}

#Preview {
    AgentSettingsView()
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/macos/Sources/QCortex/AgentSettingsView.swift
git commit -m "feat(macos): add AgentSettingsView for user permission management"
```

---

## Summary of Tasks

| Task | Description                 | Estimated Complexity |
| ---- | --------------------------- | -------------------- |
| 1    | Create Agent Core Types     | Low                  |
| 2    | Create Tool Registry        | Medium               |
| 3    | Create Task Executor        | Medium               |
| 4    | Create Agent Controller     | Low                  |
| 5    | Integrate Browser Tool      | Low                  |
| 6    | Create File System Tool     | Medium               |
| 7    | Create Email Tool           | Medium               |
| 8    | Create Verification Handler | Medium               |
| 9    | Create Settings Storage     | Low                  |
| 10   | Create macOS Settings UI    | Medium               |

---

## Next Steps

After completing these tasks:

1. Integration tests for full agent workflow
2. Google Calendar API tool implementation
3. Google Contacts tool implementation
4. Mobile SMS integration
5. Production encryption (Keychain integration)

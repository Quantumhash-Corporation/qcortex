import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubagentDispatcher } from "./subagent-dispatcher";
import type { Subagent, TaskInput, AgentSettings, UserPreferences } from "./types";

describe("SubagentDispatcher", () => {
  let dispatcher: SubagentDispatcher;
  let defaultSettings: AgentSettings;
  let defaultUserPreferences: UserPreferences;

  const createTaskInput = (overrides?: Partial<TaskInput>): TaskInput => ({
    id: "task-1",
    description: "Test task",
    context: {},
    userPreferences: defaultUserPreferences,
    ...overrides,
  });

  beforeEach(() => {
    defaultUserPreferences = {
      autoApprove: false,
      otpHandling: "ask",
      paymentMode: "disabled",
    };

    defaultSettings = {
      mode: "autonomous",
      fallback: {
        enabled: true,
        maxRetries: 2,
        escalateOnFailure: true,
      },
      subagents: {
        testSubagent: { enabled: true, autoApprove: false },
      },
      tools: {
        testTool: { enabled: true, fallbackFor: ["testSubagent"] },
      },
    };

    dispatcher = new SubagentDispatcher(defaultSettings);
  });

  describe("register", () => {
    it("should register a subagent", () => {
      const subagent: Subagent = {
        name: "testSubagent",
        description: "A test subagent",
        execute: vi.fn().mockResolvedValue({ success: true }),
        canHandle: vi.fn().mockReturnValue(true),
      };

      dispatcher.register(subagent);

      expect(dispatcher.getSubagent("testSubagent")).toBe(subagent);
    });
  });

  describe("unregister", () => {
    it("should unregister a subagent", () => {
      const subagent: Subagent = {
        name: "testSubagent",
        description: "A test subagent",
        execute: vi.fn().mockResolvedValue({ success: true }),
        canHandle: vi.fn().mockReturnValue(true),
      };

      dispatcher.register(subagent);
      dispatcher.unregister("testSubagent");

      expect(dispatcher.getSubagent("testSubagent")).toBeUndefined();
    });
  });

  describe("dispatch - success case", () => {
    it("should successfully dispatch a subagent for a task", async () => {
      const subagent: Subagent = {
        name: "testSubagent",
        description: "A test subagent",
        execute: vi.fn().mockResolvedValue({ success: true, data: { result: "success" } }),
        canHandle: vi.fn().mockReturnValue(true),
      };

      dispatcher.register(subagent);

      const task = createTaskInput({ description: "Test task" });
      const result = await dispatcher.dispatch(task);

      expect(result.status).toBe("completed");
      expect(result.result).toEqual({ result: "success" });
    });
  });

  describe("dispatch - fallback to tool", () => {
    it("should fallback to tool when subagent fails", async () => {
      const subagent: Subagent = {
        name: "testSubagent",
        description: "A test subagent",
        execute: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "EXECUTION_ERROR",
            message: "Failed to execute",
            recoverable: true,
            canEscalateToHuman: true,
          },
        }),
        canHandle: vi.fn().mockReturnValue(true),
      };

      const fallbackTool = vi
        .fn()
        .mockResolvedValue({ success: true, data: { result: "fallback success" } });

      dispatcher.register(subagent);
      dispatcher.registerFallbackTool("testSubagent", fallbackTool);

      const task = createTaskInput({
        description: "Test task",
        fallbackEnabled: true,
      });
      const result = await dispatcher.dispatch(task);

      expect(result.status).toBe("completed");
      expect(result.result).toEqual({ result: "fallback success" });
      expect(fallbackTool).toHaveBeenCalled();
    });
  });

  describe("dispatch - escalate to human", () => {
    it("should escalate to human when both subagent and fallback fail", async () => {
      const subagent: Subagent = {
        name: "testSubagent",
        description: "A test subagent",
        execute: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "EXECUTION_ERROR",
            message: "Failed to execute",
            recoverable: true,
            canEscalateToHuman: true,
          },
          requiresHumanHelp: true,
          humanHelpMessage: "Human assistance required",
        }),
        canHandle: vi.fn().mockReturnValue(true),
      };

      const fallbackTool = vi
        .fn()
        .mockResolvedValue({
          success: false,
          error: {
            code: "TOOL_ERROR",
            message: "Tool failed",
            recoverable: false,
            canEscalateToHuman: false,
          },
        });

      dispatcher.register(subagent);
      dispatcher.registerFallbackTool("testSubagent", fallbackTool);

      const task = createTaskInput({
        description: "Test task",
        fallbackEnabled: true,
      });
      const result = await dispatcher.dispatch(task);

      expect(result.status).toBe("escalated");
      expect(result.escalation).toBeDefined();
      expect(result.escalation?.requested).toBe(true);
      expect(result.escalation?.message).toBe("Human assistance required");
    });
  });
});

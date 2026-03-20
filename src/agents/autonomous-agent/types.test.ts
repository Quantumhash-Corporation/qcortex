import { describe, expect, it } from "vitest";
import type {
  TaskStatus,
  HumanEscalation,
  TaskInput,
  UserPreferences,
  TaskResult,
  SubagentResult,
  Subagent,
  FallbackType,
  FallbackChain,
  AgentSettings,
} from "./types.js";

describe("SubagentResult", () => {
  it("should represent a successful subagent result", () => {
    const result: SubagentResult = {
      success: true,
      data: { userId: "12345" },
    };

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ userId: "12345" });
    expect(result.error).toBeUndefined();
  });

  it("should represent a failure with escalation required", () => {
    const result: SubagentResult = {
      success: false,
      error: {
        code: "ACCOUNT_CREATION_FAILED",
        message: "Unable to create account due to validation errors",
        recoverable: false,
        canEscalateToHuman: true,
      },
      requiresHumanHelp: true,
      humanHelpMessage: "Please provide valid account details",
    };

    expect(result.success).toBe(false);
    expect(result.requiresHumanHelp).toBe(true);
    expect(result.error?.canEscalateToHuman).toBe(true);
    expect(result.humanHelpMessage).toBe("Please provide valid account details");
  });

  it("should include metadata in subagent result", () => {
    const result: SubagentResult = {
      success: true,
      data: { confirmationCode: "ABC123" },
      metadata: {
        processingTime: 1500,
        attempts: 2,
      },
    };

    expect(result.metadata?.processingTime).toBe(1500);
    expect(result.metadata?.attempts).toBe(2);
  });
});

describe("FallbackChain", () => {
  it("should track multiple fallback attempts", () => {
    const chain: FallbackChain = {
      attempts: [
        {
          type: "subagent",
          name: "account-creator",
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            recoverable: true,
            canEscalateToHuman: false,
          },
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
        {
          type: "tool",
          name: "manual-account-create",
          success: true,
          timestamp: new Date("2024-01-01T10:01:00Z"),
        },
      ],
      finalStatus: "completed",
    };

    expect(chain.attempts).toHaveLength(2);
    expect(chain.attempts[0].type).toBe("subagent");
    expect(chain.attempts[1].type).toBe("tool");
    expect(chain.finalStatus).toBe("completed");
  });

  it("should handle escalation in fallback chain", () => {
    const chain: FallbackChain = {
      attempts: [
        {
          type: "subagent",
          name: "otp-fetcher",
          success: false,
          error: {
            code: "OTP_TIMEOUT",
            message: "OTP not received in time",
            recoverable: false,
            canEscalateToHuman: true,
          },
          timestamp: new Date(),
        },
        {
          type: "human",
          name: "support-agent",
          success: true,
          timestamp: new Date(),
        },
      ],
      finalStatus: "escalated",
    };

    expect(chain.finalStatus).toBe("escalated");
    expect(chain.attempts[1].type).toBe("human");
  });
});

describe("TaskInput", () => {
  it("should validate TaskInput structure", () => {
    const userPreferences: UserPreferences = {
      autoApprove: true,
      otpHandling: "auto",
      paymentMode: "view",
    };

    const input: TaskInput = {
      id: "task-001",
      description: "Create a new user account",
      context: { source: "web", ip: "192.168.1.1" },
      userPreferences,
      fallbackEnabled: true,
      maxRetries: 3,
    };

    expect(input.id).toBe("task-001");
    expect(input.userPreferences.otpHandling).toBe("auto");
    expect(input.fallbackEnabled).toBe(true);
    expect(input.maxRetries).toBe(3);
  });

  it("should validate default optional fields", () => {
    const input: TaskInput = {
      id: "task-002",
      description: "Simple task",
      context: {},
      userPreferences: {
        autoApprove: false,
        otpHandling: "manual",
        paymentMode: "disabled",
      },
    };

    expect(input.fallbackEnabled).toBeUndefined();
    expect(input.maxRetries).toBeUndefined();
  });
});

describe("TaskResult", () => {
  it("should represent a completed task", () => {
    const result: TaskResult = {
      id: "task-001",
      status: "completed",
      result: { accountId: "acc-123" },
    };

    expect(result.status).toBe("completed");
    expect(result.result).toEqual({ accountId: "acc-123" });
  });

  it("should represent a failed task with escalation", () => {
    const result: TaskResult = {
      id: "task-002",
      status: "escalated",
      error: {
        code: "IRRECOVERABLE_ERROR",
        message: "System unavailable",
        recoverable: false,
        canEscalateToHuman: true,
      },
      escalation: {
        requested: true,
        message: "Escalating to human support",
        retryCount: 3,
      },
    };

    expect(result.status).toBe("escalated");
    expect(result.escalation?.requested).toBe(true);
    expect(result.escalation?.retryCount).toBe(3);
  });
});

describe("HumanEscalation", () => {
  it("should track escalation state", () => {
    const escalation: HumanEscalation = {
      requested: true,
      message: "User needs manual account verification",
      providedInfo: { phone: "+1234567890" },
      retryCount: 2,
    };

    expect(escalation.requested).toBe(true);
    expect(escalation.providedInfo).toEqual({ phone: "+1234567890" });
    expect(escalation.retryCount).toBe(2);
  });
});

describe("Subagent", () => {
  it("should define subagent interface", () => {
    const mockSubagent: Subagent = {
      name: "account-creator",
      description: "Creates user accounts in the system",
      canHandle: (task: TaskInput) => task.description.includes("account"),
      execute: async (_task: TaskInput) => ({
        success: true,
        data: { accountId: "new-account" },
      }),
    };

    const task: TaskInput = {
      id: "test-task",
      description: "Create an account",
      context: {},
      userPreferences: {
        autoApprove: false,
        otpHandling: "ask",
        paymentMode: "disabled",
      },
    };

    expect(mockSubagent.canHandle(task)).toBe(true);
  });
});

describe("AgentSettings", () => {
  it("should validate agent settings structure", () => {
    const settings: AgentSettings = {
      mode: "autonomous",
      fallback: {
        enabled: true,
        maxRetries: 3,
        escalateOnFailure: true,
      },
      subagents: {
        "account-creator": { enabled: true, autoApprove: false },
        "otp-fetcher": { enabled: true, autoApprove: true },
      },
      tools: {
        "web-form": { enabled: true, fallbackFor: ["account-creator"] },
      },
    };

    expect(settings.mode).toBe("autonomous");
    expect(settings.fallback.escalateOnFailure).toBe(true);
    expect(settings.subagents["account-creator"]?.enabled).toBe(true);
  });

  it("should support assisted mode", () => {
    const settings: AgentSettings = {
      mode: "assisted",
      fallback: {
        enabled: false,
        maxRetries: 1,
        escalateOnFailure: false,
      },
      subagents: {},
      tools: {},
    };

    expect(settings.mode).toBe("assisted");
    expect(settings.fallback.enabled).toBe(false);
  });
});

describe("TaskStatus", () => {
  it("should allow all valid task statuses", () => {
    const statuses: TaskStatus[] = ["pending", "running", "completed", "failed", "escalated"];

    expect(statuses).toContain("pending");
    expect(statuses).toContain("running");
    expect(statuses).toContain("completed");
    expect(statuses).toContain("failed");
    expect(statuses).toContain("escalated");
  });
});

describe("FallbackType", () => {
  it("should allow all valid fallback types", () => {
    const types: FallbackType[] = ["subagent", "tool", "human"];

    expect(types).toContain("subagent");
    expect(types).toContain("tool");
    expect(types).toContain("human");
  });
});

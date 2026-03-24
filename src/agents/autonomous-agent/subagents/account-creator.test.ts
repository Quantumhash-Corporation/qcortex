import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TaskInput } from "../types.js";
import { AccountCreatorSubagent } from "./account-creator.js";

describe("AccountCreatorSubagent", () => {
  let subagent: AccountCreatorSubagent;
  const defaultUserPreferences = {
    autoApprove: false,
    otpHandling: "auto" as const,
    paymentMode: "disabled" as const,
  };

  beforeEach(() => {
    subagent = new AccountCreatorSubagent();
  });

  describe("name and description", () => {
    it("should identify as AccountCreator", () => {
      expect(subagent.name).toBe("AccountCreator");
    });

    it("should have correct description", () => {
      expect(subagent.description).toBe(
        "Creates accounts on websites, handles form filling and OTP verification",
      );
    });
  });

  describe("canHandle", () => {
    it("should handle create account tasks with website context", () => {
      const task: TaskInput = {
        id: "task-1",
        description: "Create a new account on example.com",
        context: { website: "https://example.com" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle sign up tasks with website context", () => {
      const task: TaskInput = {
        id: "task-2",
        description: "Sign up for a new account",
        context: { website: "example.com" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle register tasks with website context", () => {
      const task: TaskInput = {
        id: "task-3",
        description: "Register for the service",
        context: { website: "example.com" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should not handle account tasks without website context", () => {
      const task: TaskInput = {
        id: "task-4",
        description: "Create an account",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(false);
    });

    it("should not handle unrelated tasks", () => {
      const task: TaskInput = {
        id: "task-5",
        description: "Send a message to John",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(false);
    });
  });

  describe("execute", () => {
    it("should return error when website is missing", async () => {
      const task: TaskInput = {
        id: "task-1",
        description: "Create a new account",
        context: {},
        userPreferences: defaultUserPreferences,
      };

      const result = await subagent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("MISSING_WEBSITE");
      expect(result.requiresHumanHelp).toBe(true);
    });

    it("should create account successfully without OTP verification", async () => {
      const mockBrowserTool = {
        navigate: vi.fn().mockResolvedValue(undefined),
        snapshot: vi.fn().mockResolvedValue({ text: "Welcome! You have successfully signed up." }),
        click: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        waitForSelector: vi.fn().mockResolvedValue(undefined),
      };

      const subagentWithBrowser = new AccountCreatorSubagent({
        browserTool: mockBrowserTool,
      });

      const task: TaskInput = {
        id: "task-2",
        description: "Create account on example.com",
        context: {
          website: "example.com",
          formData: { email: "test@example.com", password: "password123" },
        },
        userPreferences: defaultUserPreferences,
      };

      const result = await subagentWithBrowser.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("accountCreated", true);
      expect(result.data).toHaveProperty("verified", true);
    });

    it("should handle OTP verification when required", async () => {
      const mockBrowserTool = {
        navigate: vi.fn().mockResolvedValue(undefined),
        snapshot: vi
          .fn()
          .mockResolvedValueOnce({ text: "Please verify your email" })
          .mockResolvedValueOnce({ text: "Enter OTP code" }),
        click: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        type: vi.fn().mockResolvedValue(undefined),
        waitForSelector: vi.fn().mockResolvedValue(undefined),
      };

      const mockOtpFetcher = vi.fn().mockResolvedValue({
        success: true,
        data: { otp: "123456" },
      });

      const subagentWithOtp = new AccountCreatorSubagent({
        browserTool: mockBrowserTool,
        otpFetcher: mockOtpFetcher,
      });

      const task: TaskInput = {
        id: "task-3",
        description: "Create account and verify",
        context: {
          website: "example.com",
          email: "test@example.com",
          formData: { email: "test@example.com", password: "password123" },
        },
        userPreferences: defaultUserPreferences,
      };

      const result = await subagentWithOtp.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("verified", true);
      expect(mockOtpFetcher).toHaveBeenCalled();
    });
  });
});

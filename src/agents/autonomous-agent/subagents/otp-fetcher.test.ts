import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TaskInput } from "../types.js";
import { OTPFetcherSubagent } from "./otp-fetcher.js";

describe("OTPFetcherSubagent", () => {
  let subagent: OTPFetcherSubagent;
  const defaultUserPreferences = {
    autoApprove: false,
    otpHandling: "auto" as const,
    paymentMode: "disabled" as const,
  };

  beforeEach(() => {
    subagent = new OTPFetcherSubagent();
  });

  describe("name and description", () => {
    it("should identify as OTPFetcher", () => {
      expect(subagent.name).toBe("OTPFetcher");
    });

    it("should have correct description", () => {
      expect(subagent.description).toBe(
        "Retrieves verification codes (OTP) from email, SMS, or other sources",
      );
    });
  });

  describe("canHandle", () => {
    it("should handle OTP tasks by description", () => {
      const task: TaskInput = {
        id: "task-1",
        description: "Get the OTP code from email",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle verification code tasks", () => {
      const task: TaskInput = {
        id: "task-2",
        description: "Please provide the verification code",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle 2FA tasks", () => {
      const task: TaskInput = {
        id: "task-3",
        description: "Complete the 2FA verification",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle two-factor tasks", () => {
      const task: TaskInput = {
        id: "task-4",
        description: "Enter the two-factor code",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle confirm tasks", () => {
      const task: TaskInput = {
        id: "task-5",
        description: "Please confirm your account",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle gmail source context", () => {
      const task: TaskInput = {
        id: "task-6",
        description: "Check for new messages",
        context: { source: "gmail" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle sms source context", () => {
      const task: TaskInput = {
        id: "task-7",
        description: "Check for messages",
        context: { source: "sms" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle mobile source context", () => {
      const task: TaskInput = {
        id: "task-8",
        description: "Read incoming messages",
        context: { source: "mobile" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should not handle unrelated tasks", () => {
      const task: TaskInput = {
        id: "task-9",
        description: "Send a message to John",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(false);
    });

    it("should not handle tasks without OTP context", () => {
      const task: TaskInput = {
        id: "task-10",
        description: "Create a new account",
        context: { source: "web" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(false);
    });
  });

  describe("execute", () => {
    it("should return error when no clients configured", async () => {
      const task: TaskInput = {
        id: "task-1",
        description: "Get the OTP code",
        context: { source: "gmail" },
        userPreferences: defaultUserPreferences,
      };

      const result = await subagent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("OTP_FETCH_ERROR");
      expect(result.requiresHumanHelp).toBe(true);
    });

    it("should fetch OTP from Gmail when client configured", async () => {
      const mockGmailClient = {
        listMessages: vi
          .fn()
          .mockResolvedValue([{ id: "msg-1", subject: "Your verification code is 123456" }]),
        getMessage: vi.fn().mockResolvedValue({
          id: "msg-1",
          subject: "Your verification code is 123456",
          body: "Your verification code is 123456",
        }),
      };

      const subagentWithGmail = new OTPFetcherSubagent({
        gmailClient: mockGmailClient,
      });

      const task: TaskInput = {
        id: "task-2",
        description: "Get the verification code from email",
        context: { source: "gmail" },
        userPreferences: defaultUserPreferences,
      };

      const result = await subagentWithGmail.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("otp");
    });

    it("should fetch OTP from mobile/SMS when client configured", async () => {
      const mockMobileClient = {
        waitForSMS: vi.fn().mockResolvedValue("Your code is 789012"),
      };

      const subagentWithMobile = new OTPFetcherSubagent({
        mobileClient: mockMobileClient,
      });

      const task: TaskInput = {
        id: "task-3",
        description: "Get the SMS code",
        context: { source: "sms", phoneNumber: "+1234567890" },
        userPreferences: defaultUserPreferences,
      };

      const result = await subagentWithMobile.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("otp");
    });

    it("should extract 6-digit OTP from email", async () => {
      const mockGmailClient = {
        listMessages: vi.fn().mockResolvedValue([{ id: "msg-1" }]),
        getMessage: vi.fn().mockResolvedValue({
          id: "msg-1",
          subject: "Verification Code",
          body: "Your security code is: 654321",
        }),
      };

      const subagentWithGmail = new OTPFetcherSubagent({
        gmailClient: mockGmailClient,
      });

      const task: TaskInput = {
        id: "task-4",
        description: "Get verification code",
        context: { source: "gmail" },
        userPreferences: defaultUserPreferences,
      };

      const result = await subagentWithGmail.execute(task);

      expect(result.success).toBe(true);
      expect((result.data as { otp: string }).otp).toBe("654321");
    });

    it("should extract OTP with label from text", async () => {
      const subagentWithGmail = new OTPFetcherSubagent({
        gmailClient: {
          listMessages: vi.fn().mockResolvedValue([{ id: "msg-1" }]),
          getMessage: vi.fn().mockResolvedValue({
            id: "msg-1",
            subject: "Account Verification",
            body: "Your OTP for account verification is 111222",
          }),
        },
      });

      const task: TaskInput = {
        id: "task-5",
        description: "Get OTP code",
        context: { source: "gmail" },
        userPreferences: defaultUserPreferences,
      };

      const result = await subagentWithGmail.execute(task);

      expect(result.success).toBe(true);
      expect((result.data as { otp: string }).otp).toBe("111222");
    });
  });

  describe("extractOTP", () => {
    it("should extract plain 6-digit code", () => {
      const subagent = new OTPFetcherSubagent();
      // Access private method via unknown cast
      const extractOTP = (
        subagent as unknown as { extractOTP: (text: string) => string | null }
      ).extractOTP.bind(subagent);

      expect(extractOTP("Your code is 123456")).toBe("123456");
      expect(extractOTP("Verification: 789012")).toBe("789012");
    });

    it("should extract labeled OTP", () => {
      const subagent = new OTPFetcherSubagent();
      const extractOTP = (
        subagent as unknown as { extractOTP: (text: string) => string | null }
      ).extractOTP.bind(subagent);

      expect(extractOTP("Your OTP is 456789")).toBe("456789");
      expect(extractOTP("Security PIN: 111222")).toBe("111222");
    });

    it("should return null for invalid text", () => {
      const subagent = new OTPFetcherSubagent();
      const extractOTP = (
        subagent as unknown as { extractOTP: (text: string) => string | null }
      ).extractOTP.bind(subagent);

      expect(extractOTP("No code here")).toBeNull();
      expect(extractOTP("")).toBeNull();
    });
  });
});

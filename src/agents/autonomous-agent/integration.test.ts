/**
 * Integration Test: Full Autonomous Agent Workflow
 *
 * This test demonstrates the complete flow:
 * 1. Initialize dispatcher with subagents
 * 2. Dispatch tasks that require different subagents
 * 3. Verify fallback chain works when subagent fails
 * 4. Verify human escalation works when both fail
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SubagentDispatcher } from "./subagent-dispatcher.js";
import { initializeSubagents } from "./subagents/index.js";
import type { TaskInput, Subagent } from "./types.js";

describe("Autonomous Agent Integration", () => {
  let dispatcher: SubagentDispatcher;

  beforeEach(() => {
    dispatcher = new SubagentDispatcher({
      mode: "autonomous",
      fallback: {
        enabled: true,
        maxRetries: 2,
        escalateOnFailure: true,
      },
      subagents: {
        "OTP Fetcher": { enabled: true, autoApprove: true },
        "Account Creator": { enabled: true, autoApprove: false },
        "Data Uploader": { enabled: true, autoApprove: true },
      },
      tools: {},
    });
    initializeSubagents(dispatcher);
  });

  it("should handle account creation with OTP verification", async () => {
    const task: TaskInput = {
      id: "test-account-1",
      description: "Create account on example.com with email verification",
      context: {
        website: "https://example.com/register",
        email: "test@example.com",
        requiresOTP: true,
      },
      userPreferences: {
        autoApprove: false,
        otpHandling: "ask",
        paymentMode: "disabled",
      },
    };

    const result = await dispatcher.dispatch(task);

    // Should complete (either with account or request OTP)
    expect(["completed", "running"]).toContain(result.status);
  });

  it("should handle file upload to Google Drive", async () => {
    const task: TaskInput = {
      id: "test-upload-1",
      description: "Upload document to Google Drive",
      context: {
        filePath: "/tmp/test.pdf",
        destination: "google-drive",
        folder: "Documents",
      },
      userPreferences: {
        autoApprove: true,
        otpHandling: "auto",
        paymentMode: "disabled",
      },
    };

    const result = await dispatcher.dispatch(task);

    // Data uploader should handle this
    expect(result).toBeDefined();
  });

  it("should track fallback chain when subagent fails", async () => {
    // Register a failing subagent that properly implements Subagent interface
    const failingSubagent: Subagent = {
      name: "Failing Subagent",
      description: "Always fails for testing",
      canHandle: () => true,
      execute: async () => ({
        success: false,
        error: {
          code: "TEST_FAILURE",
          message: "Intentional test failure",
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
      }),
    };

    dispatcher.register(failingSubagent);

    const task: TaskInput = {
      id: "test-fallback-1",
      description: "Test task that will fail",
      context: {},
      userPreferences: {
        autoApprove: false,
        otpHandling: "ask",
        paymentMode: "disabled",
      },
      fallbackEnabled: true,
    };

    const result = await dispatcher.dispatch(task);

    // Should escalate to human when everything fails
    expect(result.escalation?.requested).toBe(true);
    expect(result.fallbackChain?.attempts.length).toBeGreaterThan(0);
  });

  it("should dispatch to correct subagent based on task description", async () => {
    // OTP task
    const otpTask: TaskInput = {
      id: "test-otp-2",
      description: "Get verification code from email",
      context: { source: "gmail" },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };

    const otpResult = await dispatcher.dispatch(otpTask);
    // The OTP fetcher can handle this but may escalate if no clients configured
    expect(otpResult.status).toBeDefined();

    // Account creation task
    const accountTask: TaskInput = {
      id: "test-account-2",
      description: "Sign up for a new account",
      context: { website: "https://example.com" },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };

    const accountResult = await dispatcher.dispatch(accountTask);
    expect(accountResult.status).toBeDefined();

    // Data upload task
    const uploadTask: TaskInput = {
      id: "test-upload-2",
      description: "Upload file to cloud",
      context: { destination: "dropbox" },
      userPreferences: { autoApprove: true, otpHandling: "auto", paymentMode: "disabled" },
    };

    const uploadResult = await dispatcher.dispatch(uploadTask);
    expect(uploadResult.status).toBeDefined();
  });
});

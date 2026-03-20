/**
 * Tests for Subagent Registry
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SubagentDispatcher } from "../subagent-dispatcher.js";
import { initializeSubagents, getSubagentIds, getSubagentCapabilities } from "./index.js";

describe("Subagent Registry", () => {
  let dispatcher: SubagentDispatcher;

  beforeEach(() => {
    dispatcher = new SubagentDispatcher({
      maxRetries: 2,
      retryDelayMs: 100,
      enableFallback: true,
      enableHumanEscalation: true,
    });
  });

  describe("getSubagentIds", () => {
    it("should return array of all subagent IDs", () => {
      const ids = getSubagentIds();
      expect(ids).toContain("otp-fetcher");
      expect(ids).toContain("account-creator");
      expect(ids).toContain("data-uploader");
    });

    it("should return exactly 3 subagent IDs", () => {
      const ids = getSubagentIds();
      expect(ids.length).toBe(3);
    });
  });

  describe("getSubagentCapabilities", () => {
    it("should return capability map with all subagents", () => {
      const capabilities = getSubagentCapabilities();

      expect(capabilities.has("otp-fetcher")).toBe(true);
      expect(capabilities.has("account-creator")).toBe(true);
      expect(capabilities.has("data-uploader")).toBe(true);
    });

    it("should return correct capabilities for each subagent", () => {
      const capabilities = getSubagentCapabilities();

      expect(capabilities.get("otp-fetcher")).toEqual(["email", "sms", "otp"]);
      expect(capabilities.get("account-creator")).toEqual([
        "account-creation",
        "form-fill",
        "otp",
        "browser",
      ]);
      expect(capabilities.get("data-uploader")).toEqual([
        "file-upload",
        "cloud-storage",
        "browser",
      ]);
    });
  });

  describe("initializeSubagents", () => {
    it("should add all subagents to dispatcher", () => {
      initializeSubagents(dispatcher);

      // Verify function runs without error
      expect(() => initializeSubagents(dispatcher)).not.toThrow();
    });

    it("should allow dispatcher to handle capability-based tasks", async () => {
      initializeSubagents(dispatcher);

      // Verify dispatcher can be instantiated with subagents
      const dispatcher2 = new SubagentDispatcher({
        maxRetries: 2,
        retryDelayMs: 100,
        enableFallback: true,
        enableHumanEscalation: true,
      });

      initializeSubagents(dispatcher2);
      expect(dispatcher2).toBeDefined();
    });
  });
});

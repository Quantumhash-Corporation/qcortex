import { describe, it, expect, vi } from "vitest";
import { AgentOrchestrator } from "./orchestrator";

// Mock all dependencies
vi.mock("./browser-agent", () => ({
  BrowserAgent: class {
    handle = vi.fn().mockResolvedValue({
      success: true,
      data: { url: "https://example.com", content: "Test page" },
      stepsCompleted: 2,
      totalSteps: 2,
    });
  },
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

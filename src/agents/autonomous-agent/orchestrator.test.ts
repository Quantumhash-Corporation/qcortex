import { describe, it, expect, vi } from "vitest";
import { AgentOrchestrator } from "./orchestrator";

// Mock the dependencies
vi.mock("./task-detector", () => ({
  TaskDetector: class TaskDetector {
    detect = vi.fn().mockReturnValue({
      isTask: true,
      confidence: 0.8,
      reason: "test",
      needsClarification: false,
    });
  },
}));

vi.mock("./browser-agent", () => ({
  BrowserAgent: class BrowserAgent {
    handle = vi.fn().mockResolvedValue({
      success: true,
      stepsCompleted: 2,
      totalSteps: 2,
      data: { url: "https://example.com" },
    });
  },
}));

describe("AgentOrchestrator", () => {
  describe("route", () => {
    it("should detect task and route to BrowserAgent", async () => {
      const orchestrator = new AgentOrchestrator();
      const result = await orchestrator.route("Go to example.com");

      expect(result.isTask).toBe(true);
      expect(result.success).toBe(true);
    });

    it("should return non-task for chat messages", async () => {
      // Create orchestrator and spy on the internal taskDetector's detect method
      const orchestrator = new AgentOrchestrator();
      const taskDetector = orchestrator["taskDetector"] as unknown as { detect: typeof vi.fn };
      vi.spyOn(taskDetector, "detect").mockReturnValue({
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

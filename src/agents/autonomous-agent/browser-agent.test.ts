import { describe, it, expect, vi } from "vitest";
import { BrowserAgent, WebTask } from "./browser-agent";

// Mock BrowserController
vi.mock("./tools/browser-tool", () => ({
  BrowserController: vi.fn().mockImplementation(() => ({
    status: vi.fn().mockResolvedValue({ running: true, tabs: 1 }),
    start: vi.fn().mockResolvedValue(true),
    navigate: vi.fn().mockResolvedValue(true),
    snapshot: vi.fn().mockResolvedValue({
      content: '<div><button ref="btn-login">Login</button></div>',
      refs: { "btn-login": "button" },
    }),
    click: vi.fn().mockResolvedValue(true),
    type: vi.fn().mockResolvedValue(true),
    fill: vi.fn().mockResolvedValue(true),
    getUrl: vi.fn().mockResolvedValue("https://example.com"),
  })),
  createBrowserController: vi.fn().mockImplementation(() => ({
    status: vi.fn().mockResolvedValue({ running: true, tabs: 1 }),
    start: vi.fn().mockResolvedValue(true),
    navigate: vi.fn().mockResolvedValue(true),
    snapshot: vi.fn().mockResolvedValue({
      content: '<div><button ref="btn-login">Login</button></div>',
      refs: { "btn-login": "button" },
    }),
    click: vi.fn().mockResolvedValue(true),
    type: vi.fn().mockResolvedValue(true),
    fill: vi.fn().mockResolvedValue(true),
    getUrl: vi.fn().mockResolvedValue("https://example.com"),
  })),
}));

describe("BrowserAgent", () => {
  const agent = new BrowserAgent();

  describe("handle", () => {
    it("should navigate to URL and complete simple task", async () => {
      const task: WebTask = {
        id: "test-1",
        description: "Go to example.com",
        targetUrl: "https://example.com",
      };

      const result = await agent.handle(task);
      expect(result.success).toBe(true);
    });
  });

  describe("planTask", () => {
    it("should create navigation step for URL task", async () => {
      const task: WebTask = {
        id: "test-2",
        description: "Visit google.com",
        targetUrl: "https://google.com",
      };

      const plan = await agent.planTask(task);
      expect(plan.steps).toBeDefined();
      expect(plan.steps.length).toBeGreaterThan(0);
    });

    it("should handle click step", async () => {
      const task: WebTask = {
        id: "test-3",
        description: "Click login button",
        targetUrl: "https://example.com",
        context: { action: "click", target: "btn-login" },
      };

      const plan = await agent.planTask(task);
      expect(plan.steps).toBeDefined();
    });

    it("should handle type step", async () => {
      const task: WebTask = {
        id: "test-4",
        description: "Enter username",
        context: { action: "type", target: "username", value: "testuser" },
      };

      const plan = await agent.planTask(task);
      expect(plan.steps).toBeDefined();
    });

    it("should include snapshot step by default", async () => {
      const task: WebTask = {
        id: "test-5",
        description: "Check something",
      };

      const plan = await agent.planTask(task);
      expect(plan.steps).toContainEqual({ type: "snapshot" });
      expect(plan.estimatedDuration).toBe(5000); // One step * STEP_ESTIMATE_MS
    });

    it("should include navigate step when URL provided", async () => {
      const task: WebTask = {
        id: "test-6",
        description: "Visit page",
        targetUrl: "https://example.com",
      };

      const plan = await agent.planTask(task);
      expect(plan.steps).toContainEqual({ type: "navigate", value: "https://example.com" });
    });
  });
});

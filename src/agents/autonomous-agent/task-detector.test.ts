import { describe, it, expect } from "vitest";
import { TaskDetector } from "./task-detector";

describe("TaskDetector", () => {
  const detector = new TaskDetector();

  describe("detect", () => {
    it("should detect task with URL as high confidence", () => {
      const result = detector.detect("Go to https://example.com and login");
      expect(result.isTask).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it("should detect task with action verb and object", () => {
      const result = detector.detect("Check my email and tell me about the last message");
      expect(result.isTask).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should detect casual chat with low confidence", () => {
      const result = detector.detect("Hey, how are you?");
      expect(result.isTask).toBe(false);
      expect(result.confidence).toBeLessThan(0.3);
    });

    it("should return clarification for uncertain messages", () => {
      const result = detector.detect("Can you tell me what time it is?");
      expect(result.needsClarification).toBe(true);
    });
  });
});

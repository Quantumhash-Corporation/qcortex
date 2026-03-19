import { describe, expect, it, beforeEach } from "vitest";
import type { TaskInput } from "../types.js";
import { DataUploaderSubagent } from "./data-uploader.js";

describe("DataUploaderSubagent", () => {
  let subagent: DataUploaderSubagent;
  const defaultUserPreferences = {
    autoApprove: false,
    otpHandling: "auto" as const,
    paymentMode: "disabled" as const,
  };

  beforeEach(() => {
    subagent = new DataUploaderSubagent();
  });

  describe("name and description", () => {
    it("should identify as DataUploader", () => {
      expect(subagent.name).toBe("DataUploader");
    });

    it("should have correct description", () => {
      expect(subagent.description).toBe(
        "Uploads files and data to websites, cloud storage, or web forms",
      );
    });
  });

  describe("canHandle", () => {
    it("should handle upload tasks", () => {
      const task: TaskInput = {
        id: "task-1",
        description: "Upload the file to the server",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle submit tasks", () => {
      const task: TaskInput = {
        id: "task-2",
        description: "Submit the form data",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle send tasks", () => {
      const task: TaskInput = {
        id: "task-3",
        description: "Send the document",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle attach tasks", () => {
      const task: TaskInput = {
        id: "task-4",
        description: "Attach the file to the email",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle web-form destination context", () => {
      const task: TaskInput = {
        id: "task-5",
        description: "Process the data",
        context: { destination: "web-form" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle google-drive destination context", () => {
      const task: TaskInput = {
        id: "task-6",
        description: "Save the file",
        context: { destination: "google-drive" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle dropbox destination context", () => {
      const task: TaskInput = {
        id: "task-7",
        description: "Store the document",
        context: { destination: "dropbox" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should handle filePath in context", () => {
      const task: TaskInput = {
        id: "task-8",
        description: "Process the file",
        context: { filePath: "/path/to/file.pdf" },
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(true);
    });

    it("should not handle unrelated tasks", () => {
      const task: TaskInput = {
        id: "task-9",
        description: "Read the email",
        context: {},
        userPreferences: defaultUserPreferences,
      };
      expect(subagent.canHandle(task)).toBe(false);
    });
  });
});

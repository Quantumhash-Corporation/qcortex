// Re-export for external use
import { AgentOrchestrator } from "./orchestrator";
export { AgentOrchestrator };
export { TaskDetector } from "./task-detector";
export { BrowserAgent } from "./browser-agent";
export type { TaskDetectionResult } from "./task-detector";
export type { WebTask, AgentResult, WebTaskStep, TaskPlan } from "./browser-agent";
export type { UserTask, RouteResult } from "./orchestrator";

// Handle message (entry point for integration)
// Creates a new orchestrator instance per call for simplicity
export async function handleMessage(
  message: string,
  context?: Record<string, unknown>,
): Promise<{ isTask: boolean; response?: string; needsClarification?: boolean }> {
  const orch = new AgentOrchestrator();
  const result = await orch.route(message, context);

  if (!result.isTask) {
    return { isTask: false };
  }

  if (result.needsClarification) {
    return {
      isTask: true,
      needsClarification: true,
      response: result.message,
    };
  }

  // Format response based on result
  if (result.success && result.result) {
    const data = result.result as { url?: string };
    return {
      isTask: true,
      response: `Done! I've completed the task.${data.url ? ` Visited: ${data.url}` : ""}`,
    };
  }

  return {
    isTask: true,
    response: result.error || "Something went wrong",
  };
}

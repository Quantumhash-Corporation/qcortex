import { BrowserAgent, WebTask } from "./browser-agent";
import { TaskDetector } from "./task-detector";

export interface UserTask {
  id: string;
  message: string;
  channel: string;
  context?: Record<string, unknown>;
}

export interface RouteResult {
  isTask: boolean;
  success?: boolean;
  result?: unknown;
  error?: string;
  message?: string;
  needsClarification?: boolean;
  suggestedTask?: string;
}

export class AgentOrchestrator {
  private taskDetector: TaskDetector;
  private browserAgent: BrowserAgent;

  constructor() {
    this.taskDetector = new TaskDetector();
    this.browserAgent = new BrowserAgent();
  }

  async route(message: string, context?: Record<string, unknown>): Promise<RouteResult> {
    // 1. Detect if this is a task
    const detection = this.taskDetector.detect(message);

    // 2. If needs clarification, ask user
    if (detection.needsClarification) {
      return {
        isTask: true,
        needsClarification: true,
        message: `I want to make sure I understand. Do you want me to ${detection.suggestedTask}?`,
        suggestedTask: detection.suggestedTask,
      };
    }

    // 3. If not a task, return early
    if (!detection.isTask) {
      return {
        isTask: false,
        success: false,
      };
    }

    // 4. It's a task - route to appropriate agent
    try {
      const result = await this.executeTask(message, context);
      return {
        isTask: true,
        success: true,
        result,
      };
    } catch (error) {
      return {
        isTask: true,
        success: false,
        error: String(error),
      };
    }
  }

  private async executeTask(message: string, context?: Record<string, unknown>): Promise<unknown> {
    // Extract URL from message if present
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    const targetUrl = urlMatch ? urlMatch[0] : undefined;

    // Create task
    const task: WebTask = {
      id: `task-${Date.now()}`,
      description: message,
      targetUrl,
      context,
    };

    // Route to BrowserAgent for web tasks
    // TODO: Add logic to detect other task types
    return await this.browserAgent.handle(task);
  }
}

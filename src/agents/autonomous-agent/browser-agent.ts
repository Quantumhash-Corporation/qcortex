import { BrowserController, createBrowserController } from "./tools/browser-tool";

export interface WebTask {
  id: string;
  description: string;
  targetUrl?: string;
  credentials?: {
    username?: string;
    password?: string;
  };
  context?: Record<string, unknown>;
}

export interface WebTaskStep {
  type: "navigate" | "click" | "type" | "fill" | "wait" | "snapshot" | "screenshot";
  target?: string;
  value?: string;
  options?: {
    text?: string;
    selector?: string;
    url?: string;
    timeout?: number;
    fields?: Array<{ ref: string; value: string }>;
  };
}

export interface TaskPlan {
  steps: WebTaskStep[];
  estimatedDuration: number;
}

export interface AgentResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
  stepsCompleted: number;
  totalSteps: number;
}

const TASK_KEYWORDS: Record<string, WebTaskStep[]> = {
  login: [
    { type: "navigate" },
    { type: "wait", options: { text: "username" } },
    { type: "snapshot" },
  ],
  "check email": [{ type: "navigate" }, { type: "snapshot" }],
  "create account": [
    { type: "navigate" },
    { type: "wait", options: { text: "sign" } },
    { type: "snapshot" },
  ],
};

// Resource limits
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

export class BrowserAgent {
  private browser: BrowserController;
  private timeout: number = DEFAULT_TIMEOUT;
  private maxRetries: number = MAX_RETRIES;

  constructor() {
    this.browser = createBrowserController({ timeout: this.timeout });
  }

  async handle(task: WebTask): Promise<AgentResult> {
    // Task timeout: 5 minutes
    const taskTimeoutMs = 5 * 60 * 1000;
    const taskStartTime = Date.now();

    // 1. Plan the task
    const plan = await this.planTask(task);

    // 2. Start browser if needed
    const status = await this.browser.status();
    if (!status.running) {
      const started = await this.browser.start();
      if (!started) {
        return {
          success: false,
          error: {
            code: "BROWSER_START_FAILED",
            message: "Failed to start browser",
            recoverable: true,
          },
          stepsCompleted: 0,
          totalSteps: plan.steps.length,
        };
      }
    }

    // 3. Navigate to URL if specified
    if (task.targetUrl) {
      const navigated = await this.browser.navigate(task.targetUrl);
      if (!navigated) {
        return {
          success: false,
          error: {
            code: "NAVIGATION_FAILED",
            message: "Failed to navigate to URL",
            recoverable: true,
          },
          stepsCompleted: 0,
          totalSteps: plan.steps.length,
        };
      }
    }

    // 4. Execute steps
    let stepsCompleted = 0;
    for (const step of plan.steps) {
      // Check task timeout
      if (Date.now() - taskStartTime > taskTimeoutMs) {
        return {
          success: false,
          error: {
            code: "TASK_TIMEOUT",
            message: "Task exceeded 5 minute timeout",
            recoverable: false,
          },
          stepsCompleted,
          totalSteps: plan.steps.length,
        };
      }

      const result = await this.executeStep(step);
      let stepSuccess = result.success;
      if (!stepSuccess) {
        // Retry logic
        for (let retry = 0; retry < this.maxRetries; retry++) {
          const retryResult = await this.executeStep(step);
          if (retryResult.success) {
            stepSuccess = true;
            break;
          }
        }
      }
      // Only count as completed if the step succeeded
      if (stepSuccess) {
        stepsCompleted++;
      }
    }

    // 5. Get final snapshot
    await this.browser.snapshot();

    return {
      success: true,
      stepsCompleted,
      totalSteps: plan.steps.length,
      data: { url: await this.browser.getUrl() },
    };
  }

  async planTask(task: WebTask): Promise<TaskPlan> {
    const steps: WebTaskStep[] = [];

    // If target URL provided, add navigation
    if (task.targetUrl) {
      steps.push({ type: "navigate", value: task.targetUrl });
    }

    // Analyze description to determine steps
    const desc = task.description.toLowerCase();

    // Check for known task patterns
    for (const [keyword, patternSteps] of Object.entries(TASK_KEYWORDS)) {
      if (desc.includes(keyword)) {
        steps.push(...patternSteps);
        break;
      }
    }

    // Default: just get snapshot
    if (steps.length === 0) {
      steps.push({ type: "snapshot" });
    }

    return {
      steps,
      estimatedDuration: steps.length * 5000, // 5s per step estimate
    };
  }

  private async executeStep(step: WebTaskStep): Promise<{ success: boolean; error?: string }> {
    try {
      switch (step.type) {
        case "navigate":
          if (step.value) {
            return { success: await this.browser.navigate(step.value) };
          }
          return { success: true };

        case "snapshot":
          const snapshot = await this.browser.snapshot();
          return { success: snapshot !== null };

        case "screenshot":
          const screenshot = await this.browser.screenshot();
          return { success: screenshot !== null };

        case "click":
          if (step.target) {
            return { success: await this.browser.click(step.target) };
          }
          return { success: false, error: "no target" };

        case "type":
          if (step.target && step.value) {
            return { success: await this.browser.type(step.target, step.value) };
          }
          return { success: false, error: "no target or value" };

        case "fill":
          if (step.options && Array.isArray(step.options.fields)) {
            return { success: await this.browser.fill(step.options.fields) };
          }
          return { success: false, error: "fill requires fields array" };

        case "wait":
          if (step.options) {
            return { success: await this.browser.wait(step.options) };
          }
          return { success: true };

        default:
          return { success: false, error: "unknown step type" };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

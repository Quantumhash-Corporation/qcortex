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
  type: "navigate" | "click" | "type" | "fill" | "wait" | "snapshot" | "screenshot" | "extract";
  target?: string;
  value?: string;
  options?: {
    text?: string;
    selector?: string;
    url?: string;
    timeout?: number;
    timeMs?: number;
    fields?: Array<{ ref: string; value: string }>;
    extract?: string;
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

// Resource limits
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const TASK_TIMEOUT_MS = 5 * 60 * 1000;
const STEP_ESTIMATE_MS = 5000;

interface ParsedCredentials {
  username?: string;
  password?: string;
  email?: string;
}

interface SnapshotRefs {
  [key: string]: { role: string; name?: string; type?: string; value?: string };
}

export class BrowserAgent {
  private browser: BrowserController;
  private timeout: number = DEFAULT_TIMEOUT;
  private maxRetries: number = MAX_RETRIES;
  private currentRefs: SnapshotRefs = {};
  private lastCredentials?: ParsedCredentials;

  constructor() {
    this.browser = createBrowserController({ timeout: this.timeout });
  }

  async handle(task: WebTask): Promise<AgentResult> {
    const taskTimeoutMs = TASK_TIMEOUT_MS;
    const taskStartTime = Date.now();

    // Parse credentials from description if not provided
    const credentials = task.credentials || this.parseCredentials(task.description);
    this.lastCredentials = credentials;

    // Plan the task
    const plan = await this.planTask(task, credentials);

    // Start browser if needed
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

    // Execute plan steps
    let stepsCompleted = 0;

    for (const step of plan.steps) {
      if (Date.now() - taskStartTime > taskTimeoutMs) {
        return {
          success: false,
          error: { code: "TASK_TIMEOUT", message: "Task exceeded timeout", recoverable: false },
          stepsCompleted,
          totalSteps: plan.steps.length,
        };
      }

      const result = await this.executeStep(step, credentials);
      let stepSuccess = result.success;
      if (!stepSuccess) {
        for (let retry = 0; retry < this.maxRetries; retry++) {
          const retryResult = await this.executeStep(step, credentials);
          if (retryResult.success) {
            stepSuccess = true;
            break;
          }
        }
      }
      if (stepSuccess) {
        stepsCompleted++;
      }
    }

    // Extract content if requested
    let extractedContent: string | undefined;
    const wantsContent =
      task.description.toLowerCase().includes("get") ||
      task.description.toLowerCase().includes("last") ||
      task.description.toLowerCase().includes("email") ||
      task.description.toLowerCase().includes("message");

    if (wantsContent) {
      const snapshot = await this.browser.snapshot();
      if (snapshot) {
        extractedContent = this.extractContent(snapshot);
      }
    }

    return {
      success: true,
      stepsCompleted,
      totalSteps: plan.steps.length,
      data: {
        url: await this.browser.getUrl(),
        content: extractedContent,
      },
    };
  }

  private parseCredentials(description: string): ParsedCredentials {
    const result: ParsedCredentials = {};

    // Only extract credentials for login-related tasks to avoid accidentally
    // extracting email addresses from conversational text
    const needsCredentials = /login|sign\s*in|signin|authenticate|password\s+/i.test(description);

    if (!needsCredentials) {
      return result;
    }

    // Extract email - only when explicitly labeled
    const emailMatch = description.match(
      /email\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    );
    if (emailMatch) {
      result.email = emailMatch[1];
      result.username = emailMatch[1];
    }

    // Extract password - only when explicitly labeled
    const passwordMatch = description.match(/password\s+([^\s]+)/i);
    if (passwordMatch) {
      result.password = passwordMatch[1];
    }

    return result;
  }

  async planTask(task: WebTask, credentials?: ParsedCredentials): Promise<TaskPlan> {
    const steps: WebTaskStep[] = [];
    const desc = task.description.toLowerCase();

    // Navigate to URL if specified
    if (task.targetUrl) {
      steps.push({ type: "navigate", value: task.targetUrl });
      // Wait for page to load after navigation
      steps.push({ type: "wait", options: { timeMs: 3000 } });
    }

    // Handle login tasks
    if (desc.includes("login") || desc.includes("sign in")) {
      // Get snapshot to find form fields
      steps.push({ type: "snapshot" });

      // If we have credentials, fill the form using type command
      if (credentials?.username || credentials?.email) {
        // Type username - will use dynamic ref resolution
        steps.push({
          type: "type",
          target: "__username__",
          value: credentials.username || credentials.email || "",
        });
        // Type password
        steps.push({
          type: "type",
          target: "__password__",
          value: credentials.password || "",
        });
        // Click login button
        steps.push({ type: "click", target: "__login__" });
        // Wait for login to complete
        steps.push({ type: "wait", options: { timeMs: 5000 } });
        // Get snapshot after login
        steps.push({ type: "snapshot" });
      }
    }

    // Handle content extraction
    if (
      desc.includes("get") ||
      desc.includes("last") ||
      desc.includes("email") ||
      desc.includes("message")
    ) {
      steps.push({ type: "wait", options: { timeMs: 2000 } });
      steps.push({ type: "snapshot" });
      steps.push({ type: "extract", options: { extract: "text" } });
    }

    // Default: get snapshot
    if (steps.length === 0) {
      steps.push({ type: "snapshot" });
    }

    return {
      steps,
      estimatedDuration: steps.length * STEP_ESTIMATE_MS,
    };
  }

  private resolveDynamicRefs(snapshot: { refs?: SnapshotRefs; content?: string }): void {
    if (snapshot.refs) {
      this.currentRefs = snapshot.refs;
    } else {
      try {
        const parsed =
          typeof snapshot.content === "string" ? JSON.parse(snapshot.content) : snapshot.content;
        if (parsed.refs) {
          this.currentRefs = parsed.refs;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  private findFieldRef(fieldType: "username" | "password" | "login"): string | null {
    // Search through refs to find the right field
    for (const [ref, info] of Object.entries(this.currentRefs)) {
      const name = info.name?.toLowerCase() || "";
      const role = info.role || "";

      if (fieldType === "username") {
        if (role === "textbox" && (name.includes("user") || name.includes("email"))) {
          return ref;
        }
      }
      if (fieldType === "password") {
        if (role === "textbox" && name.includes("pass")) {
          return ref;
        }
      }
      if (fieldType === "login") {
        if (role === "button" && (name.includes("login") || name.includes("sign"))) {
          return ref;
        }
      }
    }

    // Fallback: look for common patterns
    if (fieldType === "username") {
      // Look for any textbox that might be username
      for (const [ref, info] of Object.entries(this.currentRefs)) {
        if (info.role === "textbox") {
          return ref;
        }
      }
    }
    if (fieldType === "password") {
      for (const [ref, info] of Object.entries(this.currentRefs)) {
        if (info.role === "textbox") {
          return ref;
        } // after username, next textbox is likely password
      }
    }
    if (fieldType === "login") {
      for (const [ref, info] of Object.entries(this.currentRefs)) {
        if (info.role === "button") {
          return ref;
        }
      }
    }

    return null;
  }

  private extractContent(snapshot: { snapshot?: string; content?: string }): string {
    // The snapshot from browser-tool has 'snapshot' field directly
    const snapshotContent = snapshot.snapshot || snapshot.content;
    if (!snapshotContent) {
      return "";
    }

    try {
      // It's already a string, parse if needed
      const parsed =
        typeof snapshotContent === "string" ? JSON.parse(snapshotContent) : snapshotContent;
      const text = parsed.snapshot || parsed.text || snapshotContent;
      return this.snapshotToText(text);
    } catch {
      return this.snapshotToText(snapshotContent);
    }
  }

  private snapshotToText(snapshot: string): string {
    // Extract visible text from snapshot structure
    const textMatches = snapshot.match(/"([^"]+)"/g) || [];
    const lines: string[] = [];
    for (const match of textMatches) {
      const text = match.replace(/^"/, "").replace(/"$/, "");
      // Filter out UI noise
      if (text && !text.startsWith("img:") && !text.startsWith("/url:") && text.length > 1) {
        lines.push(text);
      }
    }
    return lines.join("\n");
  }

  private async executeStep(
    step: WebTaskStep,
    _credentials?: ParsedCredentials,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (step.type) {
        case "navigate":
          if (step.value) {
            return { success: await this.browser.navigate(step.value) };
          }
          return { success: true };

        case "snapshot": {
          const snapshot = await this.browser.snapshot();
          if (snapshot) {
            this.resolveDynamicRefs(snapshot);
          }
          return { success: snapshot !== null, error: snapshot ? undefined : "No snapshot" };
        }

        case "extract":
          return { success: true };

        case "screenshot":
          return { success: (await this.browser.screenshot()) !== null };

        case "click": {
          let target = step.target;
          // Resolve dynamic ref
          if (target && target.startsWith("__")) {
            const fieldType = target.replace(/__/g, "") as "username" | "password" | "login";
            target = this.findFieldRef(fieldType) || undefined;
          }
          if (target) {
            return { success: await this.browser.click(target) };
          }
          return { success: false, error: "no target" };
        }

        case "type": {
          let target = step.target;
          if (target && target.startsWith("__")) {
            const fieldType = target.replace(/__/g, "") as "username" | "password" | "login";
            target = this.findFieldRef(fieldType) || undefined;
          }
          if (target && step.value) {
            return { success: await this.browser.type(target, step.value) };
          }
          return { success: false, error: "no target or value" };
        }

        case "fill": {
          if (step.options && Array.isArray(step.options.fields)) {
            const resolvedFields = step.options.fields.map((field) => {
              let ref = field.ref;
              if (ref.startsWith("__")) {
                const fieldType = ref.replace(/__/g, "") as "username" | "password" | "login";
                const resolved = this.findFieldRef(fieldType);
                if (resolved) {
                  ref = resolved;
                }
              }
              return { ref, value: field.value };
            });
            return { success: await this.browser.fill(resolvedFields) };
          }
          return { success: false, error: "fill requires fields array" };
        }

        case "wait": {
          const waitOptions: { text?: string; selector?: string; url?: string; timeMs?: number } =
            {};
          if (step.options) {
            if (step.options.timeMs) {
              waitOptions.timeMs = step.options.timeMs;
            }
            if (step.options.text) {
              waitOptions.text = step.options.text;
            }
            if (step.options.url) {
              waitOptions.url = step.options.url;
            }
          }
          if (Object.keys(waitOptions).length > 0) {
            return { success: await this.browser.wait(waitOptions) };
          }
          return { success: true };
        }

        default:
          return { success: false, error: "unknown step type" };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

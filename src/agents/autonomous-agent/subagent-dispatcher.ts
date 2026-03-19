import type {
  Subagent,
  SubagentResult,
  TaskInput,
  TaskResult,
  AgentSettings,
  FallbackChain,
  FallbackAttempt,
} from "./types";

type FallbackTool = (input: TaskInput) => Promise<SubagentResult>;

export class SubagentDispatcher {
  private subagents: Map<string, Subagent> = new Map();
  private fallbackTools: Map<string, FallbackTool> = new Map();
  private settings: AgentSettings;

  constructor(settings: AgentSettings) {
    this.settings = settings;
  }

  register(subagent: Subagent): void {
    this.subagents.set(subagent.name, subagent);
  }

  unregister(name: string): void {
    this.subagents.delete(name);
  }

  getSubagent(name: string) {
    return this.subagents.get(name);
  }

  registerFallbackTool(subagentName: string, tool: FallbackTool): void {
    this.fallbackTools.set(subagentName, tool);
  }

  updateSettings(settings: AgentSettings): void {
    this.settings = settings;
  }

  async dispatch(task: TaskInput): Promise<TaskResult> {
    const chain: FallbackChain = {
      attempts: [],
      finalStatus: "pending",
    };

    // Find best subagent for task
    const subagent = this.findBestSubagent(task);

    if (!subagent) {
      chain.finalStatus = "failed";
      return {
        id: task.id,
        status: "failed",
        error: {
          code: "NO_SUBAGENT_FOUND",
          message: "No subagent available to handle this task",
          recoverable: false,
          canEscalateToHuman: false,
        },
        fallbackChain: chain,
      };
    }

    // Check if subagent is enabled
    if (!this.isSubagentEnabled(subagent.name)) {
      chain.finalStatus = "failed";
      return {
        id: task.id,
        status: "failed",
        error: {
          code: "SUBAGENT_DISABLED",
          message: `Subagent '${subagent.name}' is disabled`,
          recoverable: false,
          canEscalateToHuman: false,
        },
        fallbackChain: chain,
      };
    }

    // Execute subagent with retry logic
    const maxRetries = task.maxRetries ?? this.settings.fallback.maxRetries;
    const subagentResult = await this.executeWithRetry(subagent, task, maxRetries);

    // Record subagent attempt
    const subagentAttempt: FallbackAttempt = {
      type: "subagent",
      name: subagent.name,
      success: subagentResult.success,
      error: subagentResult.error,
      timestamp: new Date(),
    };
    chain.attempts.push(subagentAttempt);

    // If subagent succeeded, return result
    if (subagentResult.success) {
      chain.finalStatus = "completed";
      return {
        id: task.id,
        status: "completed",
        result: subagentResult.data,
        fallbackChain: chain,
      };
    }

    // If subagent requires human help directly
    if (subagentResult.requiresHumanHelp) {
      return this.createEscalationResult(task, subagentResult, chain);
    }

    // If subagent failed and fallback is enabled
    if (task.fallbackEnabled && this.settings.fallback.enabled) {
      const fallbackTool = this.fallbackTools.get(subagent.name);

      if (fallbackTool) {
        // Try fallback tool
        const fallbackResult = await fallbackTool(task);

        // Record fallback attempt
        const fallbackAttempt: FallbackAttempt = {
          type: "tool",
          name: subagent.name,
          success: fallbackResult.success,
          error: fallbackResult.error,
          timestamp: new Date(),
        };
        chain.attempts.push(fallbackAttempt);

        // If fallback succeeded
        if (fallbackResult.success) {
          chain.finalStatus = "completed";
          return {
            id: task.id,
            status: "completed",
            result: fallbackResult.data,
            fallbackChain: chain,
          };
        }

        // If fallback also failed and escalation is enabled
        if (this.settings.fallback.escalateOnFailure) {
          return this.createEscalationResult(task, fallbackResult, chain);
        }
      }
    }

    // If no fallback or escalation disabled, mark as failed
    chain.finalStatus = "failed";
    return {
      id: task.id,
      status: "failed",
      error: subagentResult.error,
      fallbackChain: chain,
    };
  }

  private findBestSubagent(task: TaskInput) {
    for (const subagent of this.subagents.values()) {
      if (subagent.canHandle(task)) {
        return subagent;
      }
    }
    return undefined;
  }

  private isSubagentEnabled(name: string): boolean {
    // Default to enabled if not specified in settings
    return this.settings.subagents?.[name]?.enabled ?? true;
  }

  private async executeWithRetry(
    subagent: Subagent,
    task: TaskInput,
    maxRetries: number,
  ): Promise<SubagentResult> {
    let lastResult: SubagentResult;

    for (let i = 0; i <= maxRetries; i++) {
      lastResult = await subagent.execute(task);

      if (lastResult.success) {
        return lastResult;
      }

      if (
        !lastResult.error?.recoverable ||
        lastResult.requiresHumanHelp ||
        !lastResult.error?.canEscalateToHuman
      ) {
        return lastResult;
      }
    }

    return lastResult!;
  }

  private createEscalationResult(
    task: TaskInput,
    subagentResult: SubagentResult,
    chain: FallbackChain,
  ): TaskResult {
    chain.finalStatus = "escalated";

    // Record human escalation attempt
    const humanAttempt: FallbackAttempt = {
      type: "human",
      name: "human",
      success: false,
      error: subagentResult.error,
      timestamp: new Date(),
    };
    chain.attempts.push(humanAttempt);

    return {
      id: task.id,
      status: "escalated",
      error: subagentResult.error,
      escalation: {
        requested: true,
        message: subagentResult.humanHelpMessage || "Human assistance required",
        retryCount: 0,
      },
      fallbackChain: chain,
    };
  }
}

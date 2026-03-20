// Core types for the hybrid autonomous agent system
// Supports subagent dispatch, tool fallback, and human escalation

/**
 * Status of a task being executed by the autonomous agent
 */
export type TaskStatus = "pending" | "running" | "completed" | "failed" | "escalated";

/**
 * Human escalation configuration and state
 */
export interface HumanEscalation {
  requested: boolean;
  message: string;
  providedInfo?: unknown;
  retryCount: number;
}

/**
 * User preferences for task execution
 */
export interface UserPreferences {
  autoApprove: boolean;
  otpHandling: "auto" | "manual" | "ask";
  paymentMode: "disabled" | "view" | "full";
}

/**
 * Input for a task to be executed by the autonomous agent
 */
export interface TaskInput {
  id: string;
  description: string;
  context: Record<string, unknown>;
  userPreferences: UserPreferences;
  fallbackEnabled?: boolean;
  maxRetries?: number;
}

/**
 * Error information from a subagent failure
 */
export interface SubagentError {
  code: string;
  message: string;
  recoverable: boolean;
  canEscalateToHuman: boolean;
}

/**
 * Result from a subagent execution
 */
export interface SubagentResult {
  success: boolean;
  data?: unknown;
  error?: SubagentError;
  requiresHumanHelp?: boolean;
  humanHelpMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Subagent interface for specialized task execution
 */
export interface Subagent {
  name: string;
  description: string;
  execute(input: TaskInput): Promise<SubagentResult>;
  canHandle(task: TaskInput): boolean;
}

/**
 * Type of fallback mechanism
 */
export type FallbackType = "subagent" | "tool" | "human";

/**
 * A single fallback attempt in the fallback chain
 */
export interface FallbackAttempt {
  type: FallbackType;
  name: string;
  success: boolean;
  error?: SubagentError;
  timestamp: Date;
}

/**
 * Chain of fallback attempts when subagents or tools fail
 */
export interface FallbackChain {
  attempts: FallbackAttempt[];
  finalStatus: TaskStatus;
}

/**
 * Result of a task execution by the autonomous agent
 */
export interface TaskResult {
  id: string;
  status: TaskStatus;
  result?: unknown;
  error?: SubagentError;
  escalation?: HumanEscalation;
  fallbackChain?: FallbackChain;
}

/**
 * Settings for the autonomous agent
 */
export interface AgentSettings {
  mode: "autonomous" | "assisted";
  fallback: {
    enabled: boolean;
    maxRetries: number;
    escalateOnFailure: boolean;
  };
  subagents: Record<string, { enabled: boolean; autoApprove: boolean }>;
  tools: Record<string, { enabled: boolean; fallbackFor: string[] }>;
}

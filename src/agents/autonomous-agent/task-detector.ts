export interface TaskDetectionResult {
  isTask: boolean;
  confidence: number;
  reason: string;
  needsClarification: boolean;
  suggestedTask?: string;
}

// Confidence scoring weights
const URL_WEIGHT = 0.5;
const TRIGGER_WEIGHT = 0.2;
const ACTION_VERB_WEIGHT = 0.4;
const CHAT_OVERRIDE_WEIGHT = 0.4;
const QUESTION_PENALTY = 0.15;
const INFO_SEEKING_PENALTY = 0.1;

// Thresholds
const TASK_THRESHOLD = 0.5;
const CLARIFICATION_THRESHOLD = 0.3;
const HIGH_CONFIDENCE_THRESHOLD = 0.7;

const TASK_TRIGGERS = [
  "can you",
  "please",
  "go to",
  "login",
  "check",
  "create",
  "book",
  "send",
  "upload",
  "download",
  "find",
  "get",
  "do this",
  "handle this",
  "take care of",
  "login to",
  "sign up",
  "register",
  "create an account",
];

const CHAT_OVERRIDES = [
  "what is",
  "how are",
  "hello",
  "hi",
  "hey",
  "thanks",
  "what's up",
  "how's it going",
  "tell me about",
  "?",
];

const ACTION_VERBS = [
  "check",
  "get",
  "find",
  "send",
  "create",
  "book",
  "open",
  "login",
  "sign",
  "upload",
  "download",
  "read",
  "tell",
  "show",
  "make",
  "do",
  "complete",
  "submit",
  "fill",
];

const URL_PATTERN = /https?:\/\/[^\s]+/;

export class TaskDetector {
  detect(message: string): TaskDetectionResult {
    const lower = message.toLowerCase().trim();
    let score = 0;
    const reasons: string[] = [];

    // URL in message = high confidence task (+0.5)
    if (URL_PATTERN.test(message)) {
      score += URL_WEIGHT;
      reasons.push("contains URL");
    }

    // Task trigger keyword (+0.2)
    const hasTrigger = TASK_TRIGGERS.some((t) => lower.includes(t));
    if (hasTrigger) {
      score += TRIGGER_WEIGHT;
      reasons.push("task trigger keyword");
    }

    // Action verb + object pattern (+0.4)
    const words = lower.split(/\s+/);
    const hasAction = ACTION_VERBS.some((v) => words.includes(v));
    if (hasAction && words.length > 3) {
      score += ACTION_VERB_WEIGHT;
      reasons.push("action verb with object");
    }

    // Chat override - reduces score significantly (-0.4)
    const hasChatOverride = CHAT_OVERRIDES.some((c) => lower === c || lower.startsWith(c + " "));
    if (hasChatOverride) {
      score -= CHAT_OVERRIDE_WEIGHT;
      reasons.push("chat override");
    }

    // Question mark - reduces score unless very high confidence
    if (lower.includes("?")) {
      if (score < HIGH_CONFIDENCE_THRESHOLD) {
        score -= QUESTION_PENALTY;
      }
    }

    // Check for information-seeking patterns (what, how, when, where, why)
    const infoPatterns = ["what ", "how ", "when ", "where ", "why "];
    if (infoPatterns.some((p) => lower.includes(p)) && lower.includes("?")) {
      score -= INFO_SEEKING_PENALTY;
    }

    // Clamp score between 0 and 1
    score = Math.max(0, Math.min(1, score));

    // Determine result
    const isTask = score >= TASK_THRESHOLD;
    const needsClarification = score >= CLARIFICATION_THRESHOLD && score < TASK_THRESHOLD;

    return {
      isTask,
      confidence: score,
      reason: reasons.join(", ") || "no clear signal",
      needsClarification,
      suggestedTask: needsClarification ? this.suggestTask(message) : undefined,
    };
  }

  private suggestTask(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes("what time")) {
      return "tell you the current time";
    }
    if (lower.includes("what is")) {
      return message.replace("what is", "tell you about");
    }
    return message;
  }
}

export interface TaskDetectionResult {
  isTask: boolean;
  confidence: number;
  reason: string;
  needsClarification: boolean;
  suggestedTask?: string;
}

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
      score += 0.5;
      reasons.push("contains URL");
    }

    // Task trigger keyword (+0.2)
    const hasTrigger = TASK_TRIGGERS.some((t) => lower.includes(t));
    if (hasTrigger) {
      score += 0.2;
      reasons.push("task trigger keyword");
    }

    // Action verb + object pattern (+0.4)
    const words = lower.split(/\s+/);
    const hasAction = ACTION_VERBS.some((v) => words.includes(v));
    if (hasAction && words.length > 3) {
      score += 0.4;
      reasons.push("action verb with object");
    }

    // Chat override - reduces score significantly (-0.4)
    const hasChatOverride = CHAT_OVERRIDES.some((c) => lower === c || lower.startsWith(c + " "));
    if (hasChatOverride) {
      score -= 0.4;
      reasons.push("chat override");
    }

    // Question mark - reduces score unless very high confidence
    if (lower.includes("?")) {
      if (score < 0.7) {
        score -= 0.15;
      }
    }

    // Check for information-seeking patterns (what, how, when, where, why)
    const infoPatterns = ["what ", "how ", "when ", "where ", "why "];
    if (infoPatterns.some((p) => lower.includes(p)) && lower.includes("?")) {
      score -= 0.1;
    }

    // Clamp score between 0 and 1
    score = Math.max(0, Math.min(1, score));

    // Determine result
    const isTask = score >= 0.5;
    const needsClarification = score >= 0.3 && score < 0.5;

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

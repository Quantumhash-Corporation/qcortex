import type { QCortexConfig } from "../../config/config.js";

export function makeModelFallbackCfg(overrides: Partial<QCortexConfig> = {}): QCortexConfig {
  return {
    agents: {
      defaults: {
        model: {
          primary: "openai/gpt-4.1-mini",
          fallbacks: ["anthropic/claude-haiku-3-5"],
        },
      },
    },
    ...overrides,
  } as QCortexConfig;
}

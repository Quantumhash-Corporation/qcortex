import { upsertAuthProfileWithLock } from "../agents/auth-profiles.js";
import type { QCortexConfig } from "../config/config.js";
import type { WizardPrompter } from "../wizard/prompts.js";

export const OLLAMA_DEFAULT_BASE_URL = "http://127.0.0.1:11434";
export const OLLAMA_DEFAULT_CONTEXT_WINDOW = 128000;
export const OLLAMA_DEFAULT_MAX_TOKENS = 8192;
export const OLLAMA_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
};

interface OllamaModelInfo {
  name: string;
}

interface OllamaTagsResponse {
  models?: OllamaModelInfo[];
}

async function discoverOllamaModels(baseUrl: string): Promise<string[]> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return [];
  }
  try {
    const apiBase = baseUrl.replace(/\/+$/, "");
    const response = await fetch(`${apiBase}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as OllamaTagsResponse;
    if (!data.models || data.models.length === 0) {
      return [];
    }
    return data.models.map((m) => m.name);
  } catch {
    return [];
  }
}

export async function promptAndConfigureOllama(params: {
  cfg: QCortexConfig;
  prompter: WizardPrompter;
  agentDir?: string;
}): Promise<{ config: QCortexConfig; modelId: string; modelRef: string }> {
  const baseUrlRaw = await params.prompter.text({
    message: "Ollama base URL",
    initialValue: OLLAMA_DEFAULT_BASE_URL,
    placeholder: OLLAMA_DEFAULT_BASE_URL,
    validate: (value) => (value?.trim() ? undefined : "Required"),
  });

  // Try to discover available models
  let discoveredModels: string[] = [];
  try {
    discoveredModels = await discoverOllamaModels(String(baseUrlRaw).trim());
  } catch {
    // Ignore discovery errors, user can still enter model manually
  }

  // If models discovered, show them as options; otherwise prompt for text input
  let modelId: string;
  if (discoveredModels.length > 0) {
    const selected = await params.prompter.select({
      message: "Select Ollama model",
      options: discoveredModels.map((m) => ({ label: m, value: m })),
    });
    modelId = selected;
  } else {
    const modelIdRaw = await params.prompter.text({
      message: "Ollama model",
      placeholder: "llama3.2",
      validate: (value) => (value?.trim() ? undefined : "Required"),
    });
    modelId = String(modelIdRaw).trim();
  }

  // Optional API key (Ollama local typically doesn't need one)
  const apiKeyRaw = await params.prompter.text({
    message: "Ollama API key (optional, press Enter to skip)",
    placeholder: "Leave empty for local Ollama",
  });

  const baseUrl = String(baseUrlRaw ?? "")
    .trim()
    .replace(/\/+$/, "");
  const apiKey = String(apiKeyRaw ?? "").trim() || "ollama-local";
  const modelRef = `ollama/${modelId}`;

  await upsertAuthProfileWithLock({
    profileId: "ollama:default",
    credential: { type: "api_key", provider: "ollama", key: apiKey },
    agentDir: params.agentDir,
  });

  const nextConfig: QCortexConfig = {
    ...params.cfg,
    models: {
      ...params.cfg.models,
      mode: params.cfg.models?.mode ?? "merge",
      providers: {
        ...params.cfg.models?.providers,
        ollama: {
          baseUrl,
          api: "ollama",
          apiKey: "OLLAMA_API_KEY",
          models: [
            {
              id: modelId,
              name: modelId,
              reasoning: false,
              input: ["text"],
              cost: OLLAMA_DEFAULT_COST,
              contextWindow: OLLAMA_DEFAULT_CONTEXT_WINDOW,
              maxTokens: OLLAMA_DEFAULT_MAX_TOKENS,
            },
          ],
        },
      },
    },
  };

  return { config: nextConfig, modelId, modelRef };
}

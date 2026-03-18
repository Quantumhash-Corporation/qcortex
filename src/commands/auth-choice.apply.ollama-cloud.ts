import type { QCortexConfig } from "../config/config.js";
import type { ApplyAuthChoiceParams, ApplyAuthChoiceResult } from "./auth-choice.apply.js";

const OLLAMA_CLOUD_API_BASE = "https://api.ollama.com";
const OLLAMA_DEFAULT_CONTEXT_WINDOW = 128000;
const OLLAMA_DEFAULT_MAX_TOKENS = 8192;
const OLLAMA_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
};

interface OllamaCloudModel {
  name: string;
  modified_at?: string;
  size?: number;
}

interface OllamaCloudResponse {
  models: OllamaCloudModel[];
}

async function fetchOllamaCloudModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_CLOUD_API_BASE}/api/tags`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error(`Ollama Cloud API error: ${response.status}`);
      return [];
    }
    const data = (await response.json()) as OllamaCloudResponse;
    if (!data.models || data.models.length === 0) {
      return [];
    }
    return data.models.map((m) => m.name);
  } catch (error) {
    console.error("Failed to fetch Ollama Cloud models:", error);
    return [];
  }
}

function applyOllamaCloudDefaultModel(cfg: QCortexConfig, modelRef: string): QCortexConfig {
  const existingModel = cfg.agents?.defaults?.model;
  const fallbacks =
    existingModel && typeof existingModel === "object" && "fallbacks" in existingModel
      ? (existingModel as { fallbacks?: string[] }).fallbacks
      : undefined;

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        model: {
          ...(fallbacks ? { fallbacks } : undefined),
          primary: modelRef,
        },
      },
    },
  };
}

export async function applyAuthChoiceOllamaCloud(
  params: ApplyAuthChoiceParams,
): Promise<ApplyAuthChoiceResult | null> {
  if (params.authChoice !== "ollama-cloud-api-key") {
    return null;
  }

  const { prompter, config: cfg, agentDir } = params;

  // Prompt for Ollama Cloud API key
  const apiKeyRaw = await prompter.text({
    message: "Ollama Cloud API key",
    placeholder: "Get from https://ollama.com/settings",
    validate: (value) => (value?.trim() ? undefined : "Required"),
  });
  const apiKey = String(apiKeyRaw).trim();

  if (!apiKey) {
    await prompter.note("API key is required for Ollama Cloud", "Error");
    return { config: cfg };
  }

  // Fetch available models from Ollama Cloud
  await prompter.note("Fetching available models from Ollama Cloud…", "Loading");
  const availableModels = await fetchOllamaCloudModels(apiKey);

  if (availableModels.length === 0) {
    await prompter.note("Could not fetch models. Check your API key or subscription.", "Warning");
  } else {
    await prompter.note(`Found ${availableModels.length} models`, "Success");
  }

  // Let user select a model
  let modelId: string;
  if (availableModels.length > 0) {
    const selected = await prompter.select({
      message: "Select Ollama Cloud model",
      options: availableModels.map((m) => ({ label: m, value: m })),
    });
    modelId = selected;
  } else {
    // Fallback: let user enter manually
    const modelRaw = await prompter.text({
      message: "Ollama Cloud model",
      placeholder: "llama3.2",
      validate: (value) => (value?.trim() ? undefined : "Required"),
    });
    modelId = String(modelRaw).trim();
  }

  const modelRef = `ollama-cloud/${modelId}`;

  // Store credentials
  const { upsertAuthProfileWithLock } = await import("../agents/auth-profiles.js");
  await upsertAuthProfileWithLock({
    profileId: "ollama-cloud:default",
    credential: { type: "api_key", provider: "ollama-cloud", key: apiKey },
    agentDir,
  });

  // Update config with Ollama Cloud provider
  const nextConfig: QCortexConfig = {
    ...cfg,
    models: {
      ...cfg.models,
      mode: cfg.models?.mode ?? "merge",
      providers: {
        ...cfg.models?.providers,
        "ollama-cloud": {
          baseUrl: OLLAMA_CLOUD_API_BASE,
          api: "openai-completions",
          apiKey: "OLLAMA_CLOUD_API_KEY",
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

  if (!params.setDefaultModel) {
    return { config: nextConfig, agentModelOverride: modelRef };
  }

  await prompter.note(`Default model set to ${modelRef}`, "Model configured");
  return { config: applyOllamaCloudDefaultModel(nextConfig, modelRef) };
}

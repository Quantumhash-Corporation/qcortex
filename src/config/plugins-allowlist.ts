import type { QCortexConfig } from "./config.js";

export function ensurePluginAllowlisted(cfg: QCortexConfig, pluginId: string): QCortexConfig {
  const allow = cfg.plugins?.allow;
  if (!Array.isArray(allow) || allow.includes(pluginId)) {
    return cfg;
  }
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      allow: [...allow, pluginId],
    },
  };
}

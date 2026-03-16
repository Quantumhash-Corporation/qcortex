// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to symbols used under extensions/diffs.

export type { QCortexConfig } from "../config/config.js";
export { resolvePreferredQCortexTmpDir } from "../infra/tmp-qcortex-dir.js";
export type {
  AnyAgentTool,
  QCortexPluginApi,
  QCortexPluginConfigSchema,
  PluginLogger,
} from "../plugins/types.js";

import type { AnyAgentTool, QCortexPluginApi } from "qcortex/plugin-sdk/llm-task";
import { createLlmTaskTool } from "./src/llm-task-tool.js";

export default function register(api: QCortexPluginApi) {
  api.registerTool(createLlmTaskTool(api) as unknown as AnyAgentTool, { optional: true });
}

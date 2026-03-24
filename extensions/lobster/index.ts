import type {
  AnyAgentTool,
  QCortexPluginApi,
  QCortexPluginToolFactory,
} from "qcortex/plugin-sdk/lobster";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: QCortexPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as QCortexPluginToolFactory,
    { optional: true },
  );
}

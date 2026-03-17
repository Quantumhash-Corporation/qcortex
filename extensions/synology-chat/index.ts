import type { QCortexPluginApi } from "qcortex/plugin-sdk/synology-chat";
import { emptyPluginConfigSchema } from "qcortex/plugin-sdk/synology-chat";
import { createSynologyChatPlugin } from "./src/channel.js";
import { setSynologyRuntime } from "./src/runtime.js";

const plugin = {
  id: "synology-chat",
  name: "Synology Chat",
  description: "Native Synology Chat channel plugin for QCortex",
  configSchema: emptyPluginConfigSchema(),
  register(api: QCortexPluginApi) {
    setSynologyRuntime(api.runtime);
    api.registerChannel({ plugin: createSynologyChatPlugin() });
  },
};

export default plugin;

import { vi } from "vitest";
import { installChromeUserDataDirHooks } from "./chrome-user-data-dir.test-harness.js";

const chromeUserDataDir = { dir: "/tmp/qcortex" };
installChromeUserDataDirHooks(chromeUserDataDir);

vi.mock("./chrome.js", () => ({
  isChromeCdpReady: vi.fn(async () => true),
  isChromeReachable: vi.fn(async () => true),
  launchQCortexChrome: vi.fn(async () => {
    throw new Error("unexpected launch");
  }),
  resolveQCortexUserDataDir: vi.fn(() => chromeUserDataDir.dir),
  stopQCortexChrome: vi.fn(async () => {}),
}));

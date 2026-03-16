import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { QCortexConfig } from "../config/config.js";
import "./test-helpers/fast-core-tools.js";
import { createQCortexTools } from "./qcortex-tools.js";

async function withTempAgentDir<T>(run: (agentDir: string) => Promise<T>): Promise<T> {
  const agentDir = await fs.mkdtemp(path.join(os.tmpdir(), "qcortex-tools-pdf-"));
  try {
    return await run(agentDir);
  } finally {
    await fs.rm(agentDir, { recursive: true, force: true });
  }
}

describe("createQCortexTools PDF registration", () => {
  it("includes pdf tool when pdfModel is configured", async () => {
    await withTempAgentDir(async (agentDir) => {
      const cfg: QCortexConfig = {
        agents: {
          defaults: {
            pdfModel: { primary: "openai/gpt-5-mini" },
          },
        },
      };

      const tools = createQCortexTools({ config: cfg, agentDir });
      expect(tools.some((tool) => tool.name === "pdf")).toBe(true);
    });
  });
});

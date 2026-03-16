import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "qcortex",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "qcortex", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "qcortex", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "qcortex", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "qcortex", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "qcortex", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "qcortex", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "qcortex", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "qcortex", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".qcortex-dev");
    expect(env.QCORTEX_PROFILE).toBe("dev");
    expect(env.QCORTEX_STATE_DIR).toBe(expectedStateDir);
    expect(env.QCORTEX_CONFIG_PATH).toBe(path.join(expectedStateDir, "qcortex.json"));
    expect(env.QCORTEX_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      QCORTEX_STATE_DIR: "/custom",
      QCORTEX_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.QCORTEX_STATE_DIR).toBe("/custom");
    expect(env.QCORTEX_GATEWAY_PORT).toBe("19099");
    expect(env.QCORTEX_CONFIG_PATH).toBe(path.join("/custom", "qcortex.json"));
  });

  it("uses QCORTEX_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      QCORTEX_HOME: "/srv/qcortex-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/qcortex-home");
    expect(env.QCORTEX_STATE_DIR).toBe(path.join(resolvedHome, ".qcortex-work"));
    expect(env.QCORTEX_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".qcortex-work", "qcortex.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "qcortex doctor --fix",
      env: {},
      expected: "qcortex doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "qcortex doctor --fix",
      env: { QCORTEX_PROFILE: "default" },
      expected: "qcortex doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "qcortex doctor --fix",
      env: { QCORTEX_PROFILE: "Default" },
      expected: "qcortex doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "qcortex doctor --fix",
      env: { QCORTEX_PROFILE: "bad profile" },
      expected: "qcortex doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "qcortex --profile work doctor --fix",
      env: { QCORTEX_PROFILE: "work" },
      expected: "qcortex --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "qcortex --dev doctor",
      env: { QCORTEX_PROFILE: "dev" },
      expected: "qcortex --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("qcortex doctor --fix", { QCORTEX_PROFILE: "work" })).toBe(
      "qcortex --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("qcortex doctor --fix", { QCORTEX_PROFILE: "  jbqcortex  " })).toBe(
      "qcortex --profile jbqcortex doctor --fix",
    );
  });

  it("handles command with no args after qcortex", () => {
    expect(formatCliCommand("qcortex", { QCORTEX_PROFILE: "test" })).toBe(
      "qcortex --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm qcortex doctor", { QCORTEX_PROFILE: "work" })).toBe(
      "pnpm qcortex --profile work doctor",
    );
  });
});

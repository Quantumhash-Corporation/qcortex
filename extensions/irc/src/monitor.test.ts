import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#qcortex",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#qcortex",
      rawTarget: "#qcortex",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "qcortex-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "qcortex-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "qcortex-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "qcortex-bot",
      rawTarget: "qcortex-bot",
    });
  });
});

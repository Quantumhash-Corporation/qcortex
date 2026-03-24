import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("qcortex", 16)).toBe("qcortex");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("qcortex-status-output", 10)).toBe("qcortex-s…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});

import { describe, expect, it } from "vitest";
import { formatCount } from "../lib/format-count";

describe("formatCount", () => {
  it("formats small and compact counts", () => {
    expect(formatCount(362)).toBe("362");
    expect(formatCount(97_600)).toBe("97.6k");
    expect(formatCount(1_200_000)).toBe("1.2M");
    expect(formatCount(999_999)).toBe("1M");
  });
});

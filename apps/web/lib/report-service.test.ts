import { describe, expect, it } from "vitest";
import { getReportWindow } from "./report-service";

describe("getReportWindow", () => {
  it("creates stable weekly cache keys from Monday", () => {
    const window = getReportWindow("WEEKLY", new Date("2026-06-28T12:00:00Z"));
    expect(window.cacheKey).toBe("WEEKLY:2026-06-22");
  });

  it("creates daily cache keys", () => {
    const window = getReportWindow("DAILY", new Date("2026-06-28T12:00:00Z"));
    expect(window.cacheKey).toBe("DAILY:2026-06-28");
  });
});

import { describe, expect, it } from "vitest";
import { getWeekStartISO } from "../format";

describe("getWeekStartISO", () => {
  it("returns the same date when given a Monday", () => {
    expect(getWeekStartISO("2026-06-29")).toBe("2026-06-29");
  });

  it("returns the preceding Monday for a mid-week date", () => {
    expect(getWeekStartISO("2026-07-01")).toBe("2026-06-29"); // Wednesday
  });

  it("returns the preceding Monday for a Sunday (6 days back, not forward)", () => {
    expect(getWeekStartISO("2026-07-05")).toBe("2026-06-29"); // Sunday
  });

  it("crosses a month boundary correctly", () => {
    expect(getWeekStartISO("2026-08-02")).toBe("2026-07-27"); // Sunday -> prior Monday
  });
});

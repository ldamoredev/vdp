import { describe, expect, it } from "vitest";

import { formatMinutes, hoursToMinutes } from "../TimeEntry";

describe("formatMinutes", () => {
  it("formats hours and minutes compactly", () => {
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(0)).toBe("0m");
  });

  it("clamps and rounds negative or fractional input", () => {
    expect(formatMinutes(-5)).toBe("0m");
    expect(formatMinutes(89.6)).toBe("1h 30m");
  });
});

describe("hoursToMinutes", () => {
  it("converts decimal hours to whole minutes", () => {
    expect(hoursToMinutes("1.5")).toBe(90);
    expect(hoursToMinutes("0.25")).toBe(15);
  });

  it("returns null for non-positive or invalid input", () => {
    expect(hoursToMinutes("0")).toBeNull();
    expect(hoursToMinutes("-1")).toBeNull();
    expect(hoursToMinutes("")).toBeNull();
    expect(hoursToMinutes("abc")).toBeNull();
  });
});

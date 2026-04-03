import { describe, it, expect } from "vitest";
import { withQueryParams, ApiError } from "../client";

describe("withQueryParams", () => {
  it("returns path unchanged when no params provided", () => {
    expect(withQueryParams("/foo")).toBe("/foo");
  });

  it("returns path unchanged when params is empty object", () => {
    expect(withQueryParams("/foo", {})).toBe("/foo");
  });

  it("appends single param", () => {
    expect(withQueryParams("/foo", { bar: "baz" })).toBe("/foo?bar=baz");
  });

  it("appends multiple params", () => {
    const result = withQueryParams("/foo", { a: "1", b: "2" });
    expect(result).toContain("a=1");
    expect(result).toContain("b=2");
    expect(result).toMatch(/^\/foo\?/);
  });

  it("skips undefined values", () => {
    const result = withQueryParams("/foo", { a: "1", b: undefined });
    expect(result).toBe("/foo?a=1");
  });

  it("skips all undefined values and returns plain path", () => {
    const result = withQueryParams("/foo", { a: undefined, b: undefined });
    expect(result).toBe("/foo");
  });

  it("converts numbers to strings", () => {
    expect(withQueryParams("/foo", { limit: 20 })).toBe("/foo?limit=20");
  });

  it("converts booleans to strings", () => {
    expect(withQueryParams("/foo", { active: true })).toBe("/foo?active=true");
  });
});

describe("ApiError", () => {
  it("creates error with message, status, and code", () => {
    const error = new ApiError("Not found", {
      status: 404,
      code: "RESOURCE_NOT_FOUND",
    });

    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
    expect(error.code).toBe("RESOURCE_NOT_FOUND");
    expect(error.name).toBe("ApiError");
    expect(error).toBeInstanceOf(Error);
  });

  it("includes details when provided", () => {
    const details = { field: "email", reason: "invalid" };
    const error = new ApiError("Validation failed", {
      status: 422,
      details,
    });

    expect(error.details).toEqual(details);
  });

  it("defaults code to undefined when not provided", () => {
    const error = new ApiError("Server error", { status: 500 });
    expect(error.code).toBeUndefined();
  });
});

import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  taskStatusEnum,
  taskPriorityEnum,
  taskDomainEnum,
  createTaskSchema,
  updateTaskSchema,
  taskFiltersSchema,
  taskIdParamsSchema,
  taskNoteTypeEnum,
  createTaskNoteSchema,
  carryOverSchema,
  carryOverAllSchema,
  trendFiltersSchema,
  reviewFiltersSchema,
  domainStatsFiltersSchema,
} from "../tasks";

// ─── Enums ────────────────────────────────────────────────

describe("taskStatusEnum", () => {
  it.each(["pending", "done", "discarded"])("accepts '%s'", (val) => {
    expect(taskStatusEnum.parse(val)).toBe(val);
  });

  it("rejects unknown status", () => {
    expect(() => taskStatusEnum.parse("archived")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => taskStatusEnum.parse("")).toThrow();
  });
});

describe("taskPriorityEnum", () => {
  it.each([1, 2, 3])("accepts priority %d", (val) => {
    expect(taskPriorityEnum.parse(val)).toBe(val);
  });

  it("coerces string to number", () => {
    expect(taskPriorityEnum.parse("2")).toBe(2);
  });

  it("rejects priority 0 (below min)", () => {
    expect(() => taskPriorityEnum.parse(0)).toThrow();
  });

  it("rejects priority 4 (above max)", () => {
    expect(() => taskPriorityEnum.parse(4)).toThrow();
  });

  it("rejects non-integer", () => {
    expect(() => taskPriorityEnum.parse(1.5)).toThrow();
  });

  it("rejects negative number", () => {
    expect(() => taskPriorityEnum.parse(-1)).toThrow();
  });
});

describe("taskDomainEnum", () => {
  it.each(["wallet", "health", "work", "people", "study"])(
    "accepts '%s'",
    (val) => {
      expect(taskDomainEnum.parse(val)).toBe(val);
    },
  );

  it("rejects unknown domain", () => {
    expect(() => taskDomainEnum.parse("fitness")).toThrow();
  });
});

// ─── createTaskSchema ─────────────────────────────────────

describe("createTaskSchema", () => {
  it("accepts a minimal valid task (title only)", () => {
    const result = createTaskSchema.parse({ title: "Buy groceries" });
    expect(result).toEqual({
      title: "Buy groceries",
      priority: 2, // default
    });
  });

  it("accepts a fully-populated task", () => {
    const input = {
      title: "Write report",
      description: "Quarterly report for Q1",
      priority: 1,
      scheduledDate: "2026-04-01",
      domain: "work",
    };
    const result = createTaskSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("defaults priority to 2 when omitted", () => {
    const result = createTaskSchema.parse({ title: "Something" });
    expect(result.priority).toBe(2);
  });

  it("allows null description", () => {
    const result = createTaskSchema.parse({
      title: "Task",
      description: null,
    });
    expect(result.description).toBeNull();
  });

  it("allows null domain", () => {
    const result = createTaskSchema.parse({ title: "Task", domain: null });
    expect(result.domain).toBeNull();
  });

  it("allows omitted scheduledDate", () => {
    const result = createTaskSchema.parse({ title: "Task" });
    expect(result.scheduledDate).toBeUndefined();
  });

  // ── Invalid cases ──

  it("rejects empty title", () => {
    expect(() => createTaskSchema.parse({ title: "" })).toThrow();
  });

  it("rejects missing title", () => {
    expect(() => createTaskSchema.parse({})).toThrow();
  });

  it("rejects title exceeding 200 chars", () => {
    expect(() =>
      createTaskSchema.parse({ title: "a".repeat(201) }),
    ).toThrow();
  });

  it("accepts title at exactly 200 chars", () => {
    const result = createTaskSchema.parse({ title: "a".repeat(200) });
    expect(result.title).toHaveLength(200);
  });

  it("rejects invalid priority in create", () => {
    expect(() =>
      createTaskSchema.parse({ title: "Task", priority: 5 }),
    ).toThrow();
  });

  it("rejects invalid domain in create", () => {
    expect(() =>
      createTaskSchema.parse({ title: "Task", domain: "unknown" }),
    ).toThrow();
  });
});

// ─── updateTaskSchema ─────────────────────────────────────

describe("updateTaskSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = updateTaskSchema.parse({});
    expect(result).toEqual({});
  });

  it("accepts partial update with only title", () => {
    const result = updateTaskSchema.parse({ title: "New title" });
    expect(result).toEqual({ title: "New title" });
  });

  it("accepts partial update with only priority", () => {
    const result = updateTaskSchema.parse({ priority: 3 });
    expect(result).toEqual({ priority: 3 });
  });

  it("accepts null description to clear it", () => {
    const result = updateTaskSchema.parse({ description: null });
    expect(result.description).toBeNull();
  });

  it("accepts null domain to clear it", () => {
    const result = updateTaskSchema.parse({ domain: null });
    expect(result.domain).toBeNull();
  });

  it("rejects unknown fields (strict mode)", () => {
    expect(() =>
      updateTaskSchema.parse({ title: "Ok", status: "done" }),
    ).toThrow();
  });

  it("rejects empty title when provided", () => {
    expect(() => updateTaskSchema.parse({ title: "" })).toThrow();
  });

  it("rejects title over 200 chars", () => {
    expect(() =>
      updateTaskSchema.parse({ title: "x".repeat(201) }),
    ).toThrow();
  });
});

// ─── taskFiltersSchema ────────────────────────────────────

describe("taskFiltersSchema", () => {
  it("accepts empty object and applies defaults", () => {
    const result = taskFiltersSchema.parse({});
    expect(result).toEqual({
      limit: 50,
      offset: 0,
    });
  });

  it("accepts all filter fields", () => {
    const input = {
      scheduledDate: "2026-04-01",
      status: "pending",
      domain: "health",
      priority: 1,
      limit: 10,
      offset: 20,
    };
    const result = taskFiltersSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("coerces string limit and offset", () => {
    const result = taskFiltersSchema.parse({ limit: "25", offset: "5" });
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(5);
  });

  it("rejects limit below 1", () => {
    expect(() => taskFiltersSchema.parse({ limit: 0 })).toThrow();
  });

  it("rejects limit above 200", () => {
    expect(() => taskFiltersSchema.parse({ limit: 201 })).toThrow();
  });

  it("rejects negative offset", () => {
    expect(() => taskFiltersSchema.parse({ offset: -1 })).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      taskFiltersSchema.parse({ status: "completed" }),
    ).toThrow();
  });

  it("rejects invalid domain", () => {
    expect(() => taskFiltersSchema.parse({ domain: "fun" })).toThrow();
  });
});

// ─── taskIdParamsSchema ───────────────────────────────────

describe("taskIdParamsSchema", () => {
  it("accepts a valid UUID", () => {
    const id = randomUUID();
    const result = taskIdParamsSchema.parse({ id });
    expect(result.id).toBe(id);
  });

  it("rejects a non-UUID string", () => {
    expect(() => taskIdParamsSchema.parse({ id: "not-a-uuid" })).toThrow();
  });

  it("rejects missing id", () => {
    expect(() => taskIdParamsSchema.parse({})).toThrow();
  });

  it("rejects numeric id", () => {
    expect(() => taskIdParamsSchema.parse({ id: 123 })).toThrow();
  });
});

// ─── Task Notes ───────────────────────────────────────────

describe("taskNoteTypeEnum", () => {
  it.each(["note", "breakdown_step", "blocker"])("accepts '%s'", (val) => {
    expect(taskNoteTypeEnum.parse(val)).toBe(val);
  });

  it("rejects unknown type", () => {
    expect(() => taskNoteTypeEnum.parse("comment")).toThrow();
  });
});

describe("createTaskNoteSchema", () => {
  it("accepts content with default type", () => {
    const result = createTaskNoteSchema.parse({ content: "A note" });
    expect(result).toEqual({ content: "A note", type: "note" });
  });

  it("accepts content with explicit type", () => {
    const result = createTaskNoteSchema.parse({
      content: "Step 1",
      type: "breakdown_step",
    });
    expect(result).toEqual({ content: "Step 1", type: "breakdown_step" });
  });

  it("rejects empty content", () => {
    expect(() => createTaskNoteSchema.parse({ content: "" })).toThrow();
  });

  it("rejects missing content", () => {
    expect(() => createTaskNoteSchema.parse({})).toThrow();
  });

  it("rejects invalid note type", () => {
    expect(() =>
      createTaskNoteSchema.parse({ content: "x", type: "comment" }),
    ).toThrow();
  });
});

// ─── Carry Over ───────────────────────────────────────────

describe("carryOverSchema", () => {
  it("accepts a toDate", () => {
    const result = carryOverSchema.parse({ toDate: "2026-04-02" });
    expect(result.toDate).toBe("2026-04-02");
  });

  it("accepts empty object (toDate optional)", () => {
    const result = carryOverSchema.parse({});
    expect(result.toDate).toBeUndefined();
  });
});

describe("carryOverAllSchema", () => {
  it("accepts fromDate and toDate", () => {
    const result = carryOverAllSchema.parse({
      fromDate: "2026-04-01",
      toDate: "2026-04-02",
    });
    expect(result).toEqual({
      fromDate: "2026-04-01",
      toDate: "2026-04-02",
    });
  });

  it("accepts fromDate without toDate", () => {
    const result = carryOverAllSchema.parse({ fromDate: "2026-04-01" });
    expect(result.fromDate).toBe("2026-04-01");
    expect(result.toDate).toBeUndefined();
  });

  it("rejects missing fromDate", () => {
    expect(() => carryOverAllSchema.parse({})).toThrow();
  });
});

// ─── Stats Filters ────────────────────────────────────────

describe("trendFiltersSchema", () => {
  it("defaults days to 7", () => {
    const result = trendFiltersSchema.parse({});
    expect(result.days).toBe(7);
  });

  it("accepts custom days", () => {
    const result = trendFiltersSchema.parse({ days: 30 });
    expect(result.days).toBe(30);
  });

  it("coerces string days", () => {
    const result = trendFiltersSchema.parse({ days: "14" });
    expect(result.days).toBe(14);
  });

  it("rejects days below 1", () => {
    expect(() => trendFiltersSchema.parse({ days: 0 })).toThrow();
  });

  it("rejects days above 90", () => {
    expect(() => trendFiltersSchema.parse({ days: 91 })).toThrow();
  });
});

describe("reviewFiltersSchema", () => {
  it("accepts a date", () => {
    const result = reviewFiltersSchema.parse({ date: "2026-04-01" });
    expect(result.date).toBe("2026-04-01");
  });

  it("accepts empty object", () => {
    const result = reviewFiltersSchema.parse({});
    expect(result.date).toBeUndefined();
  });
});

describe("domainStatsFiltersSchema", () => {
  it("accepts from and to dates", () => {
    const result = domainStatsFiltersSchema.parse({
      from: "2026-03-01",
      to: "2026-03-31",
    });
    expect(result).toEqual({ from: "2026-03-01", to: "2026-03-31" });
  });

  it("accepts empty object (both optional)", () => {
    const result = domainStatsFiltersSchema.parse({});
    expect(result).toEqual({});
  });

  it("accepts only from", () => {
    const result = domainStatsFiltersSchema.parse({ from: "2026-03-01" });
    expect(result.from).toBe("2026-03-01");
    expect(result.to).toBeUndefined();
  });

  it("accepts only to", () => {
    const result = domainStatsFiltersSchema.parse({ to: "2026-03-31" });
    expect(result.to).toBe("2026-03-31");
    expect(result.from).toBeUndefined();
  });
});

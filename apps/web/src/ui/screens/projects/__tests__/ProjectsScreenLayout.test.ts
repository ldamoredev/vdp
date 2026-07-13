import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../ProjectsScreen.tsx", import.meta.url)), "utf8");

describe("ProjectsScreen layout", () => {
  it("splits the workspace according to its container width instead of the viewport", () => {
    expect(source).toContain('className="domain-projects @container/projects"');
    expect(source).toContain('@4xl/projects:grid-cols-[360px_minmax(0,1fr)]');
    expect(source).not.toContain('lg:grid-cols-[360px_minmax(0,1fr)]');
  });
});

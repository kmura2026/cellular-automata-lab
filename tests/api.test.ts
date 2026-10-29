import { describe, expect, it } from "vitest";
import { handleRun } from "../src/api.js";
import { run } from "../src/elementary.js";

function centre(width: number): number[] {
  const cells = new Array<number>(width).fill(0);
  cells[Math.floor(width / 2)] = 1;
  return cells;
}

describe("handleRun", () => {
  it("uses defaults rule=30 width=63 generations=31", async () => {
    const res = handleRun(new URLSearchParams());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = (await res.json()) as { rows: number[][] };
    expect(body.rows).toEqual(run(centre(63), 30, 31));
    expect(body.rows).toHaveLength(32);
  });

  it.each([
    [90, 7, 3],
    [110, 10, 5],
    [0, 1, 0],
    [255, 5, 2],
  ])("rule %i width %i generations %i", async (rule, width, generations) => {
    const res = handleRun(
      new URLSearchParams({
        rule: `${rule}`,
        width: `${width}`,
        generations: `${generations}`,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: number[][] };
    expect(body.rows).toEqual(run(centre(width), rule, generations));
  });

  it("accepts the upper limits", () => {
    expect(handleRun(new URLSearchParams("rule=255&width=1000&generations=1000")).status).toBe(200);
  });

  it.each([
    "rule=256",
    "rule=-1",
    "rule=abc",
    "rule=1.5",
    "rule=",
    "width=0",
    "width=1001",
    "width=-3",
    "width=2.5",
    "width=x",
    "generations=1001",
    "generations=-1",
    "generations=1.5",
    "generations=y",
  ])("rejects %s with 400", async (query) => {
    const res = handleRun(new URLSearchParams(query));
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = (await res.json()) as { error: string };
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });
});

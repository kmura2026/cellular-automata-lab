import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { run } from "../src/elementary.js";
import { createServer } from "../src/server.js";

const server = createServer();
let base = "";

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function centre(width: number): number[] {
  const cells = new Array<number>(width).fill(0);
  cells[Math.floor(width / 2)] = 1;
  return cells;
}

describe("GET /api/run", () => {
  it("uses defaults rule=30 width=63 generations=31", async () => {
    const res = await fetch(`${base}/api/run`);
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
    const res = await fetch(
      `${base}/api/run?rule=${rule}&width=${width}&generations=${generations}`,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: number[][] };
    expect(body.rows).toEqual(run(centre(width), rule, generations));
  });

  it("accepts the upper limits", async () => {
    const res = await fetch(`${base}/api/run?rule=255&width=1000&generations=1000`);
    expect(res.status).toBe(200);
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
    const res = await fetch(`${base}/api/run?${query}`);
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = (await res.json()) as { error: string };
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });
});

describe("static files", () => {
  it("serves the index page at /", async () => {
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect((await res.text()).length).toBeGreaterThan(0);
  });

  it("serves /app.js as javascript", async () => {
    const res = await fetch(`${base}/app.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/javascript/);
  });

  it.each(["/nope", "/index.html", "/package.json", "/src/server.ts", "/api/other", "/app.js/x"])(
    "returns 404 for %s",
    async (path) => {
      const res = await fetch(`${base}${path}`);
      expect(res.status).toBe(404);
    },
  );

  it("does not allow path traversal", async () => {
    const res = await fetch(`${base}/..%2Fpackage.json`);
    expect(res.status).toBe(404);
    const res2 = await fetch(`${base}/%2e%2e/package.json`);
    expect(res2.status).toBe(404);
  });
});

import { describe, expect, it } from "vitest";
import { handleRun } from "../src/api.js";
import worker from "../src/worker.js";

const origin = "https://example.com";

describe("worker fetch", () => {
  it("serves GET /api/run like handleRun", async () => {
    const query = "rule=90&width=7&generations=3";
    const res = await worker.fetch(new Request(`${origin}/api/run?${query}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(await handleRun(new URLSearchParams(query)).json());
  });

  it("uses defaults without a query", async () => {
    const res = await worker.fetch(new Request(`${origin}/api/run`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: number[][] };
    expect(body.rows).toHaveLength(32);
  });

  it("returns 400 for invalid parameters", async () => {
    const res = await worker.fetch(new Request(`${origin}/api/run?rule=256`));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error.length).toBeGreaterThan(0);
  });

  it.each(["/", "/nope", "/api/other", "/api/run/x", "/app.js"])(
    "returns 404 JSON for GET %s",
    async (path) => {
      const res = await worker.fetch(new Request(`${origin}${path}`));
      expect(res.status).toBe(404);
      expect(res.headers.get("content-type")).toContain("application/json");
      expect(await res.json()).toEqual({ error: "Not found" });
    },
  );

  it.each(["POST", "PUT", "DELETE"])("returns 404 for %s /api/run", async (method) => {
    const res = await worker.fetch(new Request(`${origin}/api/run`, { method }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });
});

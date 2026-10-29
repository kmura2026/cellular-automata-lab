import { execSync } from "node:child_process";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";

const server = createServer();
let base = "";

beforeAll(async () => {
  // web/elementary.js and web/pattern.js are generated (and gitignored), so build them first.
  execSync("npx tsc -p tsconfig.site.json", { stdio: "pipe" });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}, 60_000);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("static files", () => {
  it("serves the index page at /", async () => {
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect((await res.text()).length).toBeGreaterThan(0);
  });

  it.each(["/app.js", "/elementary.js", "/pattern.js"])("serves %s as javascript", async (path) => {
    const res = await fetch(`${base}${path}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/javascript/);
  });

  it.each([
    "/nope",
    "/index.html",
    "/package.json",
    "/src/server.ts",
    "/api/run",
    "/api/run?rule=30&width=63&generations=31",
    "/api/other",
    "/app.js/x",
  ])("returns 404 for %s", async (path) => {
    const res = await fetch(`${base}${path}`);
    expect(res.status).toBe(404);
  });

  it("does not allow path traversal", async () => {
    const res = await fetch(`${base}/..%2Fpackage.json`);
    expect(res.status).toBe(404);
    const res2 = await fetch(`${base}/%2e%2e/package.json`);
    expect(res2.status).toBe(404);
  });
});

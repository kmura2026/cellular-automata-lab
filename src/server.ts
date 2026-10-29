import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer as createHttpServer, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { run } from "./elementary.js";

const MAX_SIZE = 1000;

/** The web/ folder: next to src/ when run from source, two levels up from dist/src/. */
const webDir = [new URL("../web/", import.meta.url), new URL("../../web/", import.meta.url)]
  .map((url) => fileURLToPath(url))
  .find((dir) => existsSync(dir)) as string;

const pages: Record<string, { file: string; type: string }> = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" },
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

/** Reads a non-negative integer query parameter; throws RangeError if invalid or above max. */
function intParam(params: URLSearchParams, name: string, fallback: number, max: number): number {
  const raw = params.get(name);
  if (raw === null) return fallback;
  const value = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  if (!(value <= max)) throw new RangeError(`${name} must be an integer from 0 to ${max}`);
  return value;
}

function runFromQuery(params: URLSearchParams): number[][] {
  const rule = intParam(params, "rule", 30, 255);
  const width = intParam(params, "width", 63, MAX_SIZE);
  const generations = intParam(params, "generations", 31, MAX_SIZE);
  if (width < 1) throw new RangeError(`width must be an integer from 1 to ${MAX_SIZE}`);
  const cells = new Array<number>(width).fill(0);
  cells[Math.floor(width / 2)] = 1;
  return run(cells, rule, generations);
}

/** Creates the HTTP server: the demo page plus `GET /api/run?rule&width&generations`. */
export function createServer(): Server {
  return createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (req.method !== "GET") return sendJson(res, 404, { error: "Not found" });
    if (url.pathname === "/api/run") {
      try {
        return sendJson(res, 200, { rows: runFromQuery(url.searchParams) });
      } catch (err) {
        if (err instanceof RangeError) return sendJson(res, 400, { error: err.message });
        throw err;
      }
    }
    const page = Object.hasOwn(pages, url.pathname) ? pages[url.pathname] : undefined;
    if (!page) return sendJson(res, 404, { error: "Not found" });
    try {
      const body = await readFile(`${webDir}${page.file}`);
      res.writeHead(200, { "content-type": page.type });
      res.end(body);
    } catch {
      sendJson(res, 404, { error: "Not found" });
    }
  });
}

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer as createHttpServer, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { handleRun } from "./api.js";

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

/** Creates the HTTP server: the demo page plus `GET /api/run?rule&width&generations`. */
export function createServer(): Server {
  return createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (req.method !== "GET") return sendJson(res, 404, { error: "Not found" });
    if (url.pathname === "/api/run") {
      const result = handleRun(url.searchParams);
      res.writeHead(result.status, { "content-type": "application/json; charset=utf-8" });
      return res.end(await result.text());
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

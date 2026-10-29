import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer as createHttpServer, type Server } from "node:http";
import { fileURLToPath } from "node:url";

/** The web/ folder: next to src/ when run from source, two levels up from dist/src/. */
const webDir = [new URL("../web/", import.meta.url), new URL("../../web/", import.meta.url)]
  .map((url) => fileURLToPath(url))
  .find((dir) => existsSync(dir)) as string;

const js = "text/javascript; charset=utf-8";
const pages: Record<string, { file: string; type: string }> = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/app.js": { file: "app.js", type: js },
  "/elementary.js": { file: "elementary.js", type: js },
  "/pattern.js": { file: "pattern.js", type: js },
};

/** Creates a static dev server for the demo in web/ (run `npm run build:site` first). */
export function createServer(): Server {
  return createHttpServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    const page =
      req.method === "GET" && Object.hasOwn(pages, pathname) ? pages[pathname] : undefined;
    try {
      if (!page) throw new Error("not found");
      const body = await readFile(`${webDir}${page.file}`);
      res.writeHead(200, { "content-type": page.type });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  });
}

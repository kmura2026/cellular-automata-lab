import { handleRun, notFound } from "./api.js";

/** Cloudflare Worker: serves `GET /api/run`; static files come from the assets config. */
export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/run") return handleRun(url.searchParams);
    return notFound();
  },
};

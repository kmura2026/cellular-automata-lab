import { run } from "./elementary.js";

const MAX_SIZE = 1000;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
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

/** Handles `/api/run?rule&width&generations`: 200 `{rows}` or 400 `{error}` on invalid input. */
export function handleRun(params: URLSearchParams): Response {
  try {
    return json(200, { rows: runFromQuery(params) });
  } catch (err) {
    if (err instanceof RangeError) return json(400, { error: err.message });
    throw err;
  }
}

/** The JSON 404 response used for unknown routes. */
export function notFound(): Response {
  return json(404, { error: "Not found" });
}

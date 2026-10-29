# cellular-automata-lab

Experiments with cellular automata, developed mostly by AI agents driven from GitHub issues.

```ts
import { run } from "cellular-automata-lab";

const start = [...Array(15).fill(0), 1, ...Array(15).fill(0)];
for (const row of run(start, 90, 8)) {
  console.log(row.map((c) => (c ? "#" : ".")).join(""));
}
```

## Web demo

The demo draws a whole pattern at once. This capture of the live page shows rules 30, 90, 110 and 150 drawn in turn:

![Capture of the web demo drawing rules 30, 90, 110 and 150 in turn, each pattern appearing at once](docs/demo.gif)

A small demo runs on your own computer (Node 22.12+):

```sh
npm ci
npm start
```

Then open http://localhost:3000 (set `PORT` to use another port). Pick a rule, width and number of
steps, and press Draw.

Browser tests (`tests/browser/`, Playwright) open the page of a server that is already running.
With `npm start` running in another terminal:

```sh
npx playwright install chromium   # once
npm run test:browser              # set BASE_URL to test another address
```

Extending it: the page in `web/` only talks to `GET /api/run` (`src/server.ts`), so a future
backend can add endpoints there without changing how the page works. `npm start` builds first and
has no runtime dependencies, so a deployment can run the same command, or
`node dist/src/main.js` after `npm run build`, with `PORT` set.

## Cloudflare deployment

The demo also runs as a Cloudflare Worker (`src/worker.ts`) that serves `web/` as static assets and
`GET /api/run`; the configuration is `wrangler.jsonc`.

```sh
npm ci
npm run cf:dev      # local run, needs no Cloudflare account
npm run cf:deploy   # deploy; run `npx wrangler login` first, or set CLOUDFLARE_API_TOKEN
```

See [docs/ai-workflow.md](docs/ai-workflow.md) for how issues become pull requests.

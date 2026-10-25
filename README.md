# cellular-automata-lab

Experiments with cellular automata, developed mostly by AI agents driven from GitHub issues.

```ts
import { run } from "cellular-automata-lab";

const start = [...Array(15).fill(0), 1, ...Array(15).fill(0)];
for (const row of run(start, 90, 8)) {
  console.log(row.map((c) => (c ? "#" : ".")).join(""));
}
```

See [docs/ai-workflow.md](docs/ai-workflow.md) for how issues become pull requests.

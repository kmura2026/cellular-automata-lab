# cellular-automata-lab

Experiments with cellular automata, developed mostly by AI agents driven from GitHub issues.

```python
from cellular_automata_lab import run
for row in run([0] * 15 + [1] + [0] * 15, rule=90, generations=8):
    print("".join("#" if c else "." for c in row))
```

See [docs/ai-workflow.md](docs/ai-workflow.md) for how issues become pull requests.

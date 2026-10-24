"""Elementary (1D, two-state, radius-1) cellular automata using Wolfram rule numbers."""

from collections.abc import Sequence


def _check_rule(rule: int) -> None:
    if not 0 <= rule <= 255:
        raise ValueError(f"rule must be in 0..255, got {rule}")


def step(cells: Sequence[int], rule: int) -> list[int]:
    """Return the next generation. The row wraps around at both ends."""
    _check_rule(rule)
    n = len(cells)
    return [
        (rule >> (cells[i - 1] << 2 | cells[i] << 1 | cells[(i + 1) % n])) & 1 for i in range(n)
    ]


def run(cells: Sequence[int], rule: int, generations: int) -> list[list[int]]:
    """Return the initial row followed by `generations` further rows."""
    if generations < 0:
        raise ValueError("generations must be non-negative")
    history = [list(cells)]
    for _ in range(generations):
        history.append(step(history[-1], rule))
    return history

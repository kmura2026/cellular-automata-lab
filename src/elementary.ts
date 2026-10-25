/** Elementary (1D, two-state, radius-1) cellular automata using Wolfram rule numbers. */

function checkRule(rule: number): void {
  if (!Number.isInteger(rule) || rule < 0 || rule > 255) {
    throw new RangeError(`rule must be in 0..255, got ${rule}`);
  }
}

/** Return the next generation. The row wraps around at both ends. */
export function step(cells: readonly number[], rule: number): number[] {
  checkRule(rule);
  const n = cells.length;
  return cells.map((centre, i) => {
    const left = cells[(i - 1 + n) % n] ?? 0;
    const right = cells[(i + 1) % n] ?? 0;
    return (rule >> ((left << 2) | (centre << 1) | right)) & 1;
  });
}

/** Return the initial row followed by `generations` further rows. */
export function run(cells: readonly number[], rule: number, generations: number): number[][] {
  if (!Number.isInteger(generations) || generations < 0) {
    throw new RangeError("generations must be a non-negative integer");
  }
  let row = [...cells];
  const history: number[][] = [row];
  for (let g = 0; g < generations; g++) {
    row = step(row, rule);
    history.push(row);
  }
  return history;
}

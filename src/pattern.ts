import { run } from "./elementary.js";

/** Largest width and number of generations the demo accepts. */
export const MAX_SIZE = 1000;

function checkInt(name: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer from ${min} to ${max}`);
  }
}

/** Runs a rule from a single centre cell; returns `generations + 1` rows of `width` cells. */
export function pattern(rule: number, width: number, generations: number): number[][] {
  checkInt("rule", rule, 0, 255);
  checkInt("width", width, 1, MAX_SIZE);
  checkInt("generations", generations, 0, MAX_SIZE);
  const cells = new Array<number>(width).fill(0);
  cells[Math.floor(width / 2)] = 1;
  return run(cells, rule, generations);
}

import { describe, expect, it } from "vitest";
import { run } from "../src/elementary.js";
import { MAX_SIZE, pattern } from "../src/pattern.js";

function centre(width: number): number[] {
  const cells = new Array<number>(width).fill(0);
  cells[Math.floor(width / 2)] = 1;
  return cells;
}

describe("pattern", () => {
  it("exports MAX_SIZE = 1000", () => {
    expect(MAX_SIZE).toBe(1000);
  });

  it("runs the default case rule=30 width=63 generations=31", () => {
    const rows = pattern(30, 63, 31);
    expect(rows).toEqual(run(centre(63), 30, 31));
    expect(rows).toHaveLength(32);
  });

  it.each([
    [90, 7, 3],
    [110, 10, 5],
    [0, 1, 0],
    [255, 5, 2],
  ])("rule %i width %i generations %i", (rule, width, generations) => {
    expect(pattern(rule, width, generations)).toEqual(run(centre(width), rule, generations));
  });

  it("starts from a single cell at index floor(width / 2)", () => {
    expect(pattern(90, 7, 0)).toEqual([[0, 0, 0, 1, 0, 0, 0]]);
    expect(pattern(90, 4, 0)).toEqual([[0, 0, 1, 0]]);
  });

  it("accepts the upper limits", () => {
    const rows = pattern(255, 1000, 1000);
    expect(rows).toHaveLength(1001);
    expect(rows[0]).toHaveLength(1000);
  });

  const ruleMsg = "rule must be an integer from 0 to 255";
  const widthMsg = "width must be an integer from 1 to 1000";
  const genMsg = "generations must be an integer from 0 to 1000";

  it.each([
    [256, 63, 31, ruleMsg],
    [-1, 63, 31, ruleMsg],
    [1.5, 63, 31, ruleMsg],
    [Number.NaN, 63, 31, ruleMsg],
    [30, 0, 31, widthMsg],
    [30, 1001, 31, widthMsg],
    [30, -3, 31, widthMsg],
    [30, 2.5, 31, widthMsg],
    [30, Number.NaN, 31, widthMsg],
    [30, 63, 1001, genMsg],
    [30, 63, -1, genMsg],
    [30, 63, 1.5, genMsg],
    [30, 63, Number.NaN, genMsg],
  ])("rejects rule=%d width=%d generations=%d", (rule, width, generations, message) => {
    expect(() => pattern(rule, width, generations)).toThrow(RangeError);
    expect(() => pattern(rule, width, generations)).toThrow(message);
  });
});

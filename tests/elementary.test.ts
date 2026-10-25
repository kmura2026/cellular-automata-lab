import { describe, expect, it } from "vitest";
import { run, step } from "../src/index.js";

describe("step", () => {
  it("rule 90 on a single cell makes a Sierpinski row", () => {
    expect(step([0, 0, 1, 0, 0], 90)).toEqual([0, 1, 0, 1, 0]);
  });

  it("rule 0 clears everything", () => {
    expect(step([1, 1, 0, 1], 0)).toEqual([0, 0, 0, 0]);
  });

  it("wraps around edges", () => {
    // Rule 2 copies the right neighbour into a cell whose left and self are 0.
    expect(step([1, 0, 0, 0], 2)).toEqual([0, 0, 0, 1]);
  });

  it.each([-1, 256])("throws RangeError for out-of-range rule %d", (rule) => {
    expect(() => step([0, 1, 0], rule)).toThrow(RangeError);
  });

  it.each([1.5, Number.NaN])("throws RangeError for non-integer rule %s", (rule) => {
    expect(() => step([0, 1, 0], rule)).toThrow(RangeError);
  });
});

describe("run", () => {
  it("returns the initial row plus one row per generation", () => {
    const history = run([0, 1, 0], 30, 3);
    expect(history).toHaveLength(4);
    expect(history[0]).toEqual([0, 1, 0]);
  });

  it("returns only the initial row for zero generations", () => {
    expect(run([0, 1, 0], 30, 0)).toEqual([[0, 1, 0]]);
  });

  it("throws RangeError for negative generations", () => {
    expect(() => run([0, 1, 0], 30, -1)).toThrow(RangeError);
  });
});

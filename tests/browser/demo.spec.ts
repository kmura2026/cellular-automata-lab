import { expect, type Page, test } from "@playwright/test";

/** Whether the cell at (x, y) is drawn black, given the cell size in pixels. */
function isBlack(page: Page, x: number, y: number, cell: number): Promise<boolean> {
  return page.locator("#canvas").evaluate(
    (canvas: HTMLCanvasElement, { px, py }) => {
      const [r, g, b] = canvas.getContext("2d")?.getImageData(px, py, 1, 1).data ?? [];
      return r === 0 && g === 0 && b === 0;
    },
    { px: x * cell + cell / 2, py: y * cell + cell / 2 },
  );
}

test("draws the default pattern on load", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Cellular automata demo");
  // 63 cells x 32 rows at 10 px per cell.
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 630);
  await expect(page.locator("#canvas")).toHaveJSProperty("height", 320);
  await expect.poll(() => isBlack(page, 31, 0, 10)).toBe(true);
  expect(await isBlack(page, 30, 0, 10)).toBe(false);
  await expect(page.locator("#message")).toHaveText("");
});

test("redraws with the entered rule, width and steps", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 630);
  await page.getByLabel("Rule").fill("90");
  await page.getByLabel("Width in cells").fill("7");
  await page.getByLabel("Number of steps").fill("3");
  await page.getByRole("button", { name: "Draw" }).click();
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 70);
  await expect(page.locator("#canvas")).toHaveJSProperty("height", 40);
  // Rule 90 from one centre cell: row 1 has cells 2 and 4, not 3.
  await expect.poll(() => isBlack(page, 2, 1, 10)).toBe(true);
  expect(await isBlack(page, 3, 1, 10)).toBe(false);
  expect(await isBlack(page, 4, 1, 10)).toBe(true);
});

/** Fills the form and clicks Draw. */
async function draw(page: Page, rule: string, width: string, steps: string) {
  await page.getByLabel("Rule").fill(rule);
  await page.getByLabel("Width in cells").fill(width);
  await page.getByLabel("Number of steps").fill(steps);
  await page.getByRole("button", { name: "Draw" }).click();
}

test("draws rows progressively, top to bottom", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 630);
  // Rule 255 turns every cell black after the first row; 100 rows take about 5 s.
  await draw(page, "255", "5", "100");
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 50);
  const height: number = await page.locator("#canvas").evaluate((c: HTMLCanvasElement) => c.height);
  const last = height / 10 - 1;
  // Size is final and the canvas is cleared right away; the last row comes later.
  expect(await isBlack(page, 0, last, 10)).toBe(false);
  await expect.poll(() => isBlack(page, 0, last, 10), { timeout: 15000 }).toBe(true);
  expect(await isBlack(page, 0, 1, 10)).toBe(true);
});

test("drawing again mid-animation cancels the previous one", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 630);
  await draw(page, "255", "5", "200");
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 50);
  await draw(page, "90", "7", "3");
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 70);
  await expect(page.locator("#canvas")).toHaveJSProperty("height", 40);
  // The cancelled rule 255 run would paint cell 3 of row 1 black.
  await expect.poll(() => isBlack(page, 2, 1, 10)).toBe(true);
  await expect.poll(() => isBlack(page, 3, 3, 10)).toBe(false);
  expect(await isBlack(page, 3, 1, 10)).toBe(false);
  expect(await isBlack(page, 4, 1, 10)).toBe(true);
});

test("shows an error for an invalid value", async ({ page }) => {
  await page.goto("/");
  // Wait for the draw on load, so it cannot clear the message afterwards.
  await expect(page.locator("#canvas")).toHaveJSProperty("width", 630);
  await page.getByLabel("Width in cells").fill("");
  await page.getByRole("button", { name: "Draw" }).click();
  await expect(page.locator("#message")).toContainText("width must be an integer from 1 to 1000");
});

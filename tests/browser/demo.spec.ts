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
  expect(await isBlack(page, 31, 0, 10)).toBe(true);
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
  expect(await isBlack(page, 2, 1, 10)).toBe(true);
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

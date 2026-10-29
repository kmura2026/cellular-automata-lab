import { defineConfig } from "@playwright/test";

/** Browser tests for the web demo. They expect a server that is already running at BASE_URL. */
export default defineConfig({
  testDir: "tests/browser",
  forbidOnly: !!process.env.CI,
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000" },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});

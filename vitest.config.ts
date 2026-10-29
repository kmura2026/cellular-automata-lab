import { configDefaults, defineConfig } from "vitest/config";

// Skip build output, and tests/browser/ (Playwright, run with `npm run test:browser`).
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, "dist/**", "tests/browser/**"] },
});

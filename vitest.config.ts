import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "threads",
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://meet.google.com/",
      },
    },
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["entrypoints/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts", "tests/**"],
    },
  },
});

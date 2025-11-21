import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(__dirname, "tests/setupTests.ts")],
    css: false,
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "coverage"),
      reporter: ["text", "json", "html"],
      exclude: [
        "tests/e2e/**",
        "tests/helpers/**",
        "**/*.config.{js,ts}",
        "**/.next/**",
        "scripts/**",
      ],
      thresholds: {
        // Quality coverage thresholds - balanced for thoroughness and practicality
        statements: 85,  // Core logic should be well-tested (currently: 100% ✅)
        branches: 71,    // Error handling coverage - matches current (71.42%), aim to improve to 75%+
        functions: 85,   // Ensure most functions have test coverage (currently: 100% ✅)
        lines: 85,       // Consistent with statements for code execution (currently: 100% ✅)
      },
    },
  },
});

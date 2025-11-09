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
      exclude: ["tests/e2e/**", "**/*.config.{js,ts}", "**/.next/**", "scripts/**"],
    },
  },
});


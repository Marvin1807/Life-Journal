import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"], testTimeout: 30_000, fileParallelism: false },
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
});

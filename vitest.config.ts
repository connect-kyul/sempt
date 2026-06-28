import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["packages/shared/src/**/*.ts", "packages/ai/src/**/*.ts", "apps/web/lib/**/*.ts"]
    }
  },
  resolve: {
    alias: {
      "@sempt/shared": `${root}packages/shared/src/index.ts`,
      "@sempt/ai": `${root}packages/ai/src/index.ts`,
      "@sempt/config": `${root}packages/config/src/index.ts`,
      "@sempt/database": `${root}packages/database/src/index.ts`
    }
  }
});

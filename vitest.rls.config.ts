import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: ".env.rls.test", quiet: true });

export default defineConfig({
  test: {
    environment: "node",
    include: ["rls-tests/**/*.test.ts"],
    passWithNoTests: false,
    testTimeout: 20_000,
  },
});

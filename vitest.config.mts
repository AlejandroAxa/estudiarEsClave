import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src"), "server-only": path.resolve(import.meta.dirname, "scripts/vacio.ts") } },
  test: { environment: "node", testTimeout: 60000, hookTimeout: 120000 },
});

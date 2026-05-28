import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    css: false,
    // Force demo mode (no backend) so the suite is deterministic and offline.
    // These override anything in .env.local.
    env: { VITE_USER_ID: "", VITE_API_URL: "", VITE_FORJA_MODE: "elite" },
    include: ["tests/**/*.test.tsx"],
    restoreMocks: true,
    clearMocks: true,
  },
});

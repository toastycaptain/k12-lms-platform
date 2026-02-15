import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**"],
      exclude: [
        "src/app/**",
        "src/components/AppShell.tsx",
        "src/components/AiAssistantPanel.tsx",
        "src/components/GoogleDrivePicker.tsx",
      ],
      thresholds: {
        lines: 10,
      },
    },
  },
});

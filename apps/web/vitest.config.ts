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
      include: [
        "src/components/**",
        "src/lib/**",
        "src/app/login/page.tsx",
        "src/app/dashboard/page.tsx",
        "src/app/plan/units/page.tsx",
        "src/app/plan/units/[id]/page.tsx",
        "src/app/teach/courses/[courseId]/page.tsx",
        "src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx",
        "src/app/teach/courses/[courseId]/gradebook/page.tsx",
        "src/app/learn/courses/[courseId]/page.tsx",
        "src/app/assess/quizzes/[quizId]/take/page.tsx",
        "src/app/assess/quizzes/[quizId]/page.tsx",
        "src/app/communicate/page.tsx",
        "src/app/admin/users/page.tsx",
        "src/app/admin/integrations/saml/page.tsx",
        "src/app/admin/standards/page.tsx",
        "src/app/report/page.tsx",
      ],
      exclude: ["src/test/setup.ts", "src/test/**", "src/**/*.test.ts", "src/**/*.test.tsx"],
      thresholds: {
        lines: 40,
      },
    },
  },
});

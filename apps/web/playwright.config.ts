import { defineConfig } from "@playwright/test";

const webPort = Number(process.env.E2E_WEB_PORT || 3000);
const apiPort = Number(process.env.E2E_API_PORT || 4000);
const apiBaseUrl = process.env.E2E_API_BASE_URL || `http://localhost:${apiPort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  webServer: [
    {
      command:
        `cd ../core && RAILS_ENV=test ENABLE_E2E_TEST_HELPERS=true FRONTEND_URL=http://localhost:${webPort} ` +
        `bundle exec rails db:prepare && RAILS_ENV=test ENABLE_E2E_TEST_HELPERS=true FRONTEND_URL=http://localhost:${webPort} ` +
        `bundle exec rails server -p ${apiPort}`,
      port: apiPort,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: `NEXT_PUBLIC_API_URL=${apiBaseUrl}/api/v1 npm run dev -- --port ${webPort}`,
      port: webPort,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});

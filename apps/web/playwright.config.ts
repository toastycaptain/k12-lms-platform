import { defineConfig } from "@playwright/test";

const webPort = Number(process.env.E2E_WEB_PORT || 3200);
const apiPort = Number(process.env.E2E_API_PORT || 4200);
const webBaseUrl = process.env.E2E_WEB_BASE_URL || `http://localhost:${webPort}`;
const apiBaseUrl = process.env.E2E_API_BASE_URL || `http://localhost:${apiPort}`;
const proxyCoreUrl = process.env.CORE_URL || apiBaseUrl;
const nextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL || `${webBaseUrl}/api/v1`;
const allowInsecureCoreUrl = process.env.ALLOW_INSECURE_CORE_URL || "true";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: webBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  webServer: [
    {
      command:
        `cd ../core && RAILS_ENV=test ENABLE_E2E_TEST_HELPERS=true FRONTEND_URL=${webBaseUrl} ` +
        `bundle exec rails db:prepare && RAILS_ENV=test ENABLE_E2E_TEST_HELPERS=true FRONTEND_URL=${webBaseUrl} ` +
        `bundle exec rails server -p ${apiPort}`,
      port: apiPort,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command:
        `ALLOW_INSECURE_CORE_URL=${allowInsecureCoreUrl} CORE_URL=${proxyCoreUrl} NEXT_PUBLIC_API_URL=${nextPublicApiUrl} ` +
        `npm run build && ALLOW_INSECURE_CORE_URL=${allowInsecureCoreUrl} CORE_URL=${proxyCoreUrl} ` +
        `NEXT_PUBLIC_API_URL=${nextPublicApiUrl} npm run start -- --port ${webPort}`,
      port: webPort,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});

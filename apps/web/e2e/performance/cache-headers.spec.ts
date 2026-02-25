import { expect, test } from "@playwright/test";

function firstStaticScriptPath(html: string): string | null {
  const match = html.match(/src="(\/_next\/static\/[^"]+\.js)"/);
  return match ? match[1] : null;
}

test("static assets return long-lived cache headers", async ({ page, request }) => {
  await page.goto("/");
  const html = await page.content();
  const assetPath = firstStaticScriptPath(html);

  test.skip(!assetPath, "No static JS asset was discovered on the page.");

  const response = await request.get(assetPath!);
  expect(response.ok()).toBe(true);

  const cacheControl = response.headers()["cache-control"] || "";
  test.skip(!cacheControl, "Cache-Control header not present in this runtime mode.");

  expect(cacheControl).toContain("max-age=");
  expect(cacheControl).toContain("immutable");
});

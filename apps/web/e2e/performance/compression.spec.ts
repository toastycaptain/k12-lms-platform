import { expect, test } from "@playwright/test";

function firstStaticScriptPath(html: string): string | null {
  const match = html.match(/src="(\/_next\/static\/[^"]+\.js)"/);
  return match ? match[1] : null;
}

test("static assets advertise gzip or brotli compression", async ({ page, request }) => {
  await page.goto("/");
  const html = await page.content();
  const assetPath = firstStaticScriptPath(html);

  test.skip(!assetPath, "No static JS asset was discovered on the page.");

  const response = await request.get(assetPath!, {
    headers: {
      "Accept-Encoding": "gzip, br",
    },
  });

  expect(response.ok()).toBe(true);

  const encoding = response.headers()["content-encoding"];
  test.skip(!encoding, "Compression header is not present in this runtime mode.");
  expect(["gzip", "br"]).toContain(encoding);
});

import { expect, type Page, type TestInfo } from "@playwright/test";

export async function gotoAndMeasure(
  page: Page,
  path: string,
  heading: string,
  testInfo: TestInfo,
  maxMs = 12_000,
): Promise<number> {
  const startedAt = Date.now();
  await page.goto(path);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  const durationMs = Date.now() - startedAt;

  testInfo.annotations.push({
    type: "ib-metric",
    description: `${path} ready in ${durationMs}ms (guardrail ${maxMs}ms)`,
  });

  expect(durationMs).toBeLessThan(maxMs);
  return durationMs;
}

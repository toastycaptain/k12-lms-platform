import { expect, test } from "@playwright/test";
import { loginAsTeacher } from "../helpers/auth";
import { gotoAndMeasure } from "./helpers";
import { registerPhase7Lifecycle } from "./lifecycle";

registerPhase7Lifecycle();

test("@ib-phase7-teacher teacher home exposes the action console, benchmark rail, and command palette", async ({
  page,
}, testInfo) => {
  await loginAsTeacher(page);

  const readyMs = await gotoAndMeasure(page, "/ib/home", "Teacher action console", testInfo);
  testInfo.annotations.push({ type: "ib-baseline", description: `teacher_home=${readyMs}ms` });

  await expect(page.getByText("Quick actions")).toBeVisible();
  await expect(page.getByText("Workflow benchmark snapshot")).toBeVisible();

  await page.keyboard.press("Control+K");
  await expect(page.getByText("IB command palette")).toBeVisible();
  await expect(page.getByPlaceholder("Search workspaces, pages, or actions")).toBeVisible();
});

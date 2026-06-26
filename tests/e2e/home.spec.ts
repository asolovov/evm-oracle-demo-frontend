import { expect, test } from "@playwright/test";

test("home page links to the example", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /frontend-next-template/i })).toBeVisible();
  await page.getByRole("link", { name: /see example/i }).click();
  await expect(page).toHaveURL(/\/example$/);
  await expect(page.getByRole("heading", { name: /conform/i })).toBeVisible();
});

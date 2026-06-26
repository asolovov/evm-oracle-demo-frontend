import { expect, test } from "@playwright/test";

// These journeys don't depend on the Go backend being up — the landing page
// renders its shell even when the API is unreachable. The tile-click path is
// guarded so it only runs when live feeds are present.

test("landing renders the hero and demo disclaimer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /lighthouse/i })).toBeVisible();
  await expect(page.getByText(/DO NOT USE IN PRODUCTION/i)).toBeVisible();
});

test("demo banner can be dismissed and stays dismissed", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByText(/DO NOT USE IN PRODUCTION/i);
  await expect(banner).toBeVisible();
  await page.getByRole("button", { name: /DISMISS/i }).click();
  await expect(banner).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(/DO NOT USE IN PRODUCTION/i)).toHaveCount(0);
});

test("footer exposes author credentials on every page", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText(/Built by Andrei Solovov/i)).toBeVisible();
  await expect(footer.getByRole("link", { name: "GITHUB" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "LINKEDIN" })).toBeVisible();
});

test("about page shows author, credentials and projects", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /ABOUT/i }).first().click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: /ANDREI SOLOVOV/i })).toBeVisible();
  await expect(page.getByText(/Gateway\.fm/i).first()).toBeVisible();
});

test("an asset tile, when present, drills down to the detail page", async ({ page }) => {
  await page.goto("/");
  const tile = page.getByTestId(/^asset-tile-/).first();
  // Skip cleanly when no backend feeds are available in this environment.
  test.skip((await tile.count()) === 0, "no live feeds available");
  await tile.click();
  await expect(page).toHaveURL(/\/assets\//);
  await expect(page.getByRole("button", { name: /REQUEST UPDATE/i })).toBeVisible();
});

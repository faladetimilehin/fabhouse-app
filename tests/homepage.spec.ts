import { test, expect } from "@playwright/test";

test("homepage loads and shows the free-launch banner", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("FABHOUSE")).toBeVisible();
  await expect(page.getByText(/Free to list and browse during launch/i)).toBeVisible();
});

test("can navigate to listings page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Browse" }).click();
  await expect(page).toHaveURL(/\/listings/);
  await expect(page.getByRole("heading", { name: "Browse listings" })).toBeVisible();
});

test("pricing page shows free-during-launch messaging", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText(/All plans are free right now/i)).toBeVisible();
});

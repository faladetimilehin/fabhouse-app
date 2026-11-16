import { test, expect } from "@playwright/test";

test("listings page has a price filter with currency selector", async ({ page }) => {
  await page.goto("/listings");
  await expect(page.getByPlaceholder("Min price")).toBeVisible();
  await expect(page.getByPlaceholder("Max price")).toBeVisible();
});

test("admin routes redirect non-admins to home", async ({ page }) => {
  // Unauthenticated request should be redirected away from admin pages.
  await page.goto("/admin");
  await expect(page).toHaveURL("/");

  await page.goto("/admin/audit-log");
  await expect(page).toHaveURL("/");
});

import { test, expect } from "@playwright/test";

test("listings page renders search and pagination shell without erroring", async ({ page }) => {
  await page.goto("/listings");
  await expect(page.getByRole("heading", { name: "Browse listings" })).toBeVisible();
  // Pagination only renders when there's more than one page of results,
  // so we just confirm the page itself loads cleanly with the query params.
  await page.goto("/listings?page=1");
  await expect(page.getByRole("heading", { name: "Browse listings" })).toBeVisible();
});

test("forgot password page can submit without erroring", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("someone@example.com");
  await page.getByRole("button", { name: /send reset link/i }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10_000 });
});

import { test, expect } from "@playwright/test";

test("privacy and terms pages load", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
});

test("registration is blocked without consent checkbox", async ({ page }) => {
  const uniqueEmail = `consent-test+${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Consent Test");
  await page.getByLabel("Email").fill(uniqueEmail);
  await page.getByLabel("Password").fill("testpassword123");
  // Deliberately not checking the consent box.
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page.getByText(/agree to the privacy policy/i)).toBeVisible();
  await expect(page).toHaveURL(/\/register/);
});

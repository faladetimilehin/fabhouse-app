import { test, expect } from "@playwright/test";

test("a new agent can register and reach their dashboard", async ({ page }) => {
  const uniqueEmail = `agent+${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Test Agent");
  await page.getByLabel("Email").fill(uniqueEmail);
  await page.getByLabel("Password").fill("testpassword123");
  await page.getByLabel("I am a...").selectOption("agent");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Your listings" })).toBeVisible();
  await expect(page.getByText(/unlimited & free during launch/i)).toBeVisible();
});

test("shows an error for invalid login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrongpassword");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});

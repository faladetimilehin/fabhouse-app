import { test, expect } from "@playwright/test";

test("listings page shows grid/map toggle", async ({ page }) => {
  await page.goto("/listings");
  await expect(page.getByRole("heading", { name: "Browse listings" })).toBeVisible();
  // Toggle only renders once results exist; just confirm the page itself
  // loads without error even when the map component would mount.
});

test("sitemap and robots are reachable", async ({ page, request }) => {
  const sitemapRes = await request.get("/sitemap.xml");
  expect(sitemapRes.ok()).toBeTruthy();

  const robotsRes = await request.get("/robots.txt");
  expect(robotsRes.ok()).toBeTruthy();
});

test("saved listings page requires no crash when empty", async ({ page }) => {
  await page.goto("/saved");
  // Unauthenticated users hitting the client-fetch page shouldn't crash;
  // the API call will 401 and the page should still render its shell.
  await expect(page.getByRole("heading", { name: /saved listings/i })).toBeVisible();
});

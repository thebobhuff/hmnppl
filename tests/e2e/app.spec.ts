import { test, expect } from "@playwright/test";

test("landing page hero CTAs navigate to working destinations", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /HR Platform/i })).toBeVisible();

  await page.getByRole("button", { name: /Get Started.*Free Trial/i }).click();
  await expect(page).toHaveURL(/\/signup/);

  await page.goto("/");
  await page.getByRole("button", { name: /Login/i }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("pricing plan CTAs route to signup with the selected plan", async ({ page }) => {
  await page.goto("/pricing");

  await page.getByRole("button", { name: /Start Growth/i }).click();
  await expect(page).toHaveURL(/\/signup\?plan=growth/);

  await page.goto("/pricing");
  await page.getByRole("button", { name: /Request Demo/i }).click();
  await expect(page).toHaveURL(/\/signup\?plan=enterprise/);
});

test("auth entry pages render usable primary actions", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

  await page.goto("/signup");
  await expect(page.getByLabel(/company name/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /create account|sign up|get started/i })).toBeVisible();
});

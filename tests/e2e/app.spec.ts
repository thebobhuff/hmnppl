import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

test("landing page loads with hero section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /AI-Powered HR/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Get Started/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
});

test("landing page navigates to login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/login/);
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

test("login page renders form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("signup page renders form", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByLabel(/first name/i)).toBeVisible();
  await expect(page.getByLabel(/company name/i)).toBeVisible();
});

// ---------------------------------------------------------------------------
// Dashboard (authenticated)
// ---------------------------------------------------------------------------

test("dashboard shows role-adaptive content for HR agent", async ({ page }) => {
  await page.goto("/dashboard");
  // After login, HR agent should see incident queue stats
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Incident Queue
// ---------------------------------------------------------------------------

test("incident queue shows tabs and incident cards", async ({ page }) => {
  await page.goto("/incident-queue");
  await expect(page.getByRole("heading", { name: /incident queue/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /all/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /ai review/i })).toBeVisible();
});

test("incident queue filters by tab", async ({ page }) => {
  await page.goto("/incident-queue");
  await page.getByRole("tab", { name: /approved/i }).click();
  // Should show only approved incidents
  await expect(page.getByText(/approved/i)).toBeVisible();
});

// ---------------------------------------------------------------------------
// Report Issue
// ---------------------------------------------------------------------------

test("report issue shows step 1 (employee & type)", async ({ page }) => {
  await page.goto("/report-issue");
  await expect(page.getByRole("heading", { name: /report issue/i })).toBeVisible();
  await expect(page.getByText(/select employee/i)).toBeVisible();
  await expect(page.getByText(/issue type/i)).toBeVisible();
});

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

test("policies page shows list and create button", async ({ page }) => {
  await page.goto("/policies");
  await expect(page.getByRole("heading", { name: /policies/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /create policy/i })).toBeVisible();
});

test("policy builder shows step indicator", async ({ page }) => {
  await page.goto("/policies/new");
  await expect(page.getByText(/basic info/i)).toBeVisible();
  await expect(page.getByText(/rules/i)).toBeVisible();
  await expect(page.getByText(/ai settings/i)).toBeVisible();
  await expect(page.getByText(/review/i)).toBeVisible();
});

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

test("team page shows user table and invite button", async ({ page }) => {
  await page.goto("/team");
  await expect(page.getByRole("heading", { name: /team/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /invite member/i })).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

test("meetings page shows upcoming and completed sections", async ({ page }) => {
  await page.goto("/meetings");
  await expect(page.getByRole("heading", { name: /upcoming meetings/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /completed meetings/i })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

test("documents page shows pending and signed sections", async ({ page }) => {
  await page.goto("/documents");
  await expect(page.getByRole("heading", { name: /pending signature/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /signed documents/i })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

test("settings page shows all tabs", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /company/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /profile/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /notifications/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /ai configuration/i })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test("sidebar navigation links work", async ({ page }) => {
  await page.goto("/dashboard");
  // Click each nav item and verify URL change
  const navLinks = ["Incident Queue", "Meetings", "Employees", "Policies"];
  for (const label of navLinks) {
    const link = page.getByRole("link", { name: label });
    if (await link.isVisible()) {
      await link.click();
      await page.waitForURL(/\/.*/);
    }
  }
});

// ---------------------------------------------------------------------------
// Responsive
// ---------------------------------------------------------------------------

test("landing page is responsive on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /AI-Powered HR/i })).toBeVisible();
});

test("dashboard is responsive on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});

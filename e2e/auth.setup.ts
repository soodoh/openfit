import { expect, test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

/**
 * Authentication setup for E2E tests
 *
 * This setup runs once before all test projects that depend on it.
 * It authenticates as the test user and saves the storage state
 * (cookies, local storage) to be reused by all authenticated tests.
 *
 * In CI, this will first sign up the user (if not exists), then log in.
 *
 * Test credentials are expected in .env.local or CI secrets:
 * - TEST_USER: email address
 * - TEST_PASSWORD: password
 */
setup("authenticate", async ({ page }) => {
  const testUser = process.env.TEST_USER;
  const testPassword = process.env.TEST_PASSWORD;

  if (!testUser || !testPassword) {
    throw new Error(
      "TEST_USER and TEST_PASSWORD environment variables are required. " +
        "Please set them in .env.local",
    );
  }

  // Navigate to signin page
  await page.goto("/signin");

  // Wait for the login form to load (Convex query needs to complete)
  await expect(page.getByRole("button", { name: /login/i })).toBeVisible({
    timeout: 15000,
  });

  // In CI, first try to sign up the user (in case it doesn't exist yet)
  if (process.env.CI) {
    // Click sign up link
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL("/signup", { timeout: 5000 });

    // Wait for sign up form
    await expect(
      page.getByRole("button", { name: /create account/i }),
    ).toBeVisible({ timeout: 10000 });

    // Fill in sign up form
    await page.getByLabel(/email/i).fill(testUser);
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);

    // Submit sign up
    await page.getByRole("button", { name: /create account/i }).click();

    // Wait briefly - either redirects to dashboard (new user) or shows error (existing)
    await page.waitForTimeout(3000);

    // If we're on dashboard, we're done - user was created and logged in
    if (page.url().endsWith("/")) {
      await expect(page.getByText(/welcome back/i)).toBeVisible({
        timeout: 10000,
      });
      await page.context().storageState({ path: authFile });
      return;
    }

    // Otherwise, go back to sign in page to log in
    await page.goto("/signin");
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible({
      timeout: 15000,
    });
  }

  // Fill in credentials
  await page.getByLabel(/email/i).fill(testUser);
  await page.getByLabel(/password/i).fill(testPassword);

  // Submit the form
  await page.getByRole("button", { name: /login/i }).click();

  // Wait for successful authentication - should redirect to dashboard
  await expect(page).toHaveURL("/", { timeout: 15000 });

  // Verify we're on the authenticated dashboard
  await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10000 });

  // Save storage state for reuse
  await page.context().storageState({ path: authFile });
});

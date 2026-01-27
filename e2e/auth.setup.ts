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
 * Test credentials are expected in .env.local:
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

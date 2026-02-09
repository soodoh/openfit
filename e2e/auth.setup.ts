import { expect, test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

/**
 * Authentication setup for E2E tests
 *
 * This setup runs once before all test projects that depend on it.
 * It logs in as the admin user (created by db:seed) and saves the
 * storage state (cookies, local storage) to be reused by all
 * authenticated tests.
 *
 * Credentials are expected in .env.local or CI secrets:
 * - ADMIN_USER: email address
 * - ADMIN_PASSWORD: password
 */
setup("authenticate", async ({ page }) => {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPassword) {
    throw new Error(
      "ADMIN_USER and ADMIN_PASSWORD environment variables are required. " +
        "Please set them in .env.local",
    );
  }

  await page.goto("/signin");

  // Wait for the login form to load
  await expect(page.getByRole("button", { name: /login/i })).toBeVisible({
    timeout: 15000,
  });

  // Fill in credentials
  await page.getByLabel(/email/i).fill(adminUser);
  await page.getByLabel(/password/i).fill(adminPassword);

  // Submit the form
  await page.getByRole("button", { name: /login/i }).click();

  // Wait for dashboard content
  await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 30000 });

  // Save storage state for reuse
  await page.context().storageState({ path: authFile });
});

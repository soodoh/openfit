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
 * In CI, this creates an admin account via the admin setup form (database is empty).
 * Locally, this logs in with an existing test user.
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

  if (process.env.CI) {
    // In CI, database starts empty so /register shows the admin setup form
    await page.goto("/register");

    // Wait for admin setup form (shown when no users exist)
    await expect(
      page.getByRole("button", { name: /create admin account/i }),
    ).toBeVisible({ timeout: 15000 });

    // Fill admin setup form (no confirm password field)
    await page.getByLabel(/email/i).fill(testUser);
    await page.getByLabel(/password/i).fill(testPassword);

    // Submit the form
    await page.getByRole("button", { name: /create admin account/i }).click();

    // Wait for Convex auth to complete (button becomes disabled during submission)
    // Then either the page redirects or we need to navigate manually
    await page.waitForTimeout(3000);

    // Navigate to dashboard and verify auth state
    await page.goto("/");
    await expect(page.getByText(/welcome back/i)).toBeVisible({
      timeout: 30000,
    });

    // Save auth state
    const state = await page.context().storageState({ path: authFile });
    console.log("CI Auth Setup - Saved storage state:");
    console.log("  Cookies:", state.cookies.length);
    console.log("  Origins:", state.origins.length);
    if (state.origins[0]?.localStorage) {
      console.log("  LocalStorage items:", state.origins[0].localStorage.length);
      state.origins[0].localStorage.forEach((item) => {
        console.log(`    ${item.name}: ${item.value.substring(0, 50)}...`);
      });
    }
    return;
  }

  // Locally, log in with existing user
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

  // Wait for dashboard content (more reliable than URL check due to redirect timing)
  await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 30000 });

  // Save storage state for reuse
  const state = await page.context().storageState({ path: authFile });
  console.log("Local Auth Setup - Saved storage state:");
  console.log("  Cookies:", state.cookies.length);
  console.log("  Origins:", state.origins.length);
  if (state.origins[0]?.localStorage) {
    console.log("  LocalStorage items:", state.origins[0].localStorage.length);
  }
});

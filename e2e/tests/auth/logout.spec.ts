import { expect, test } from "@/e2e/fixtures/base.fixture";
import { logout } from "@/e2e/utils/auth.helper";

/**
 * Logout E2E tests
 *
 * These tests run with authentication to test logout functionality.
 */
test.describe("Logout", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    // Start on the dashboard (authenticated)
    await dashboardPage.goto();
    await expect(dashboardPage.welcomeHeading).toBeVisible();
  });

  test("should successfully logout", async ({ page }) => {
    // Perform logout
    await logout(page);

    // Should be redirected to signin page
    await expect(page).toHaveURL("/signin", { timeout: 10000 });
  });

  test("should redirect to signin after logout", async ({ page }) => {
    // Logout
    await logout(page);

    // Verify on signin page
    await expect(page).toHaveURL("/signin");

    // Should see login form
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("should not be able to access protected pages after logout", async ({
    page,
  }) => {
    // Logout first
    await logout(page);

    // Try to access dashboard
    await page.goto("/");

    // Should be redirected to signin
    await expect(page).toHaveURL("/signin", { timeout: 10000 });
  });

  test("should not be able to access routines page after logout", async ({
    page,
  }) => {
    // Logout first
    await logout(page);

    // Try to access routines
    await page.goto("/routines");

    // Should be redirected to signin
    await expect(page).toHaveURL("/signin", { timeout: 10000 });
  });

  test("should not be able to access exercises page after logout", async ({
    page,
  }) => {
    // Logout first
    await logout(page);

    // Try to access exercises
    await page.goto("/exercises");

    // Should be redirected to signin
    await expect(page).toHaveURL("/signin", { timeout: 10000 });
  });

  test("should not be able to access logs page after logout", async ({
    page,
  }) => {
    // Logout first
    await logout(page);

    // Try to access logs
    await page.goto("/logs");

    // Should be redirected to signin
    await expect(page).toHaveURL("/signin", { timeout: 10000 });
  });

  test("should be able to login again after logout", async ({
    loginPage,
    page,
  }) => {
    // Logout first
    await logout(page);

    // Get test credentials
    const email = process.env.TEST_USER;
    const password = process.env.TEST_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    // Wait for login form
    await loginPage.waitForFormReady();

    // Login again
    await loginPage.login(email, password);

    // Should be back on dashboard
    await expect(page).toHaveURL("/", { timeout: 15000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible({
      timeout: 10000,
    });
  });
});

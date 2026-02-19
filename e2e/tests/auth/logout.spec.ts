import { expect as e2eExpect, test as e2eTest } from "@/e2e/fixtures/base.fixture";
import { logout } from "@/e2e/utils/auth.helper";
/**
 * Logout E2E tests
 *
 * These tests run with authentication to test logout functionality.
 */
e2eTest.describe("Logout", () => {
    e2eTest.beforeEach(async ({ dashboardPage }) => {
        // Start on the dashboard (authenticated)
        await dashboardPage.goto();
        await e2eExpect(dashboardPage.welcomeHeading).toBeVisible();
    });
    e2eTest("should successfully logout", async ({ page }) => {
        // Perform logout
        await logout(page);
        // Should be redirected to signin page
        await e2eExpect(page).toHaveURL("/signin", { timeout: 10_000 });
    });
    e2eTest("should redirect to signin after logout", async ({ page }) => {
        // Logout
        await logout(page);
        // Verify on signin page
        await e2eExpect(page).toHaveURL("/signin");
        // Should see login form
        await e2eExpect(page.getByRole("button", { name: /login/i })).toBeVisible();
    });
    e2eTest("should not be able to access protected pages after logout", async ({ page, }) => {
        // Logout first
        await logout(page);
        // Try to access dashboard
        await page.goto("/");
        // Should be redirected to signin
        await e2eExpect(page).toHaveURL("/signin", { timeout: 10_000 });
    });
    e2eTest("should not be able to access routines page after logout", async ({ page, }) => {
        // Logout first
        await logout(page);
        // Try to access routines
        await page.goto("/routines");
        // Should be redirected to signin
        await e2eExpect(page).toHaveURL("/signin", { timeout: 10_000 });
    });
    e2eTest("should not be able to access exercises page after logout", async ({ page, }) => {
        // Logout first
        await logout(page);
        // Try to access exercises
        await page.goto("/exercises");
        // Should be redirected to signin
        await e2eExpect(page).toHaveURL("/signin", { timeout: 10_000 });
    });
    e2eTest("should not be able to access logs page after logout", async ({ page, }) => {
        // Logout first
        await logout(page);
        // Try to access logs
        await page.goto("/logs");
        // Should be redirected to signin
        await e2eExpect(page).toHaveURL("/signin", { timeout: 10_000 });
    });
    e2eTest("should be able to login again after logout", async ({ loginPage, page, }) => {
        // Logout first
        await logout(page);
        // Get test credentials
        const email = process.env.ADMIN_USER;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password) {
            e2eTest.skip();
            return;
        }
        // Wait for login form
        await loginPage.waitForFormReady();
        // Login again
        await loginPage.login(email, password);
        // Should be back on dashboard
        await e2eExpect(page).toHaveURL("/", { timeout: 15_000 });
        await e2eExpect(page.getByText(/welcome back/i)).toBeVisible({
            timeout: 10_000,
        });
    });
});

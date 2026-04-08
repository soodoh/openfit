import {
	expect as e2eExpect,
	test as e2eTest,
} from "@/e2e/fixtures/base.fixture";
import { clearAuth, loginAsTestUser, logout } from "@/e2e/utils/auth.helper";

/**
 * Logout E2E tests
 *
 * These tests run with authentication to test logout functionality.
 */
e2eTest.describe("Logout", () => {
	e2eTest.beforeEach(async ({ dashboardPage, page }) => {
		// Each test needs its own session because logout revokes the auth token.
		await clearAuth(page);
		await loginAsTestUser(page);
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
	e2eTest(
		"should not be able to access protected pages after logout",
		async ({ page }) => {
			// Logout first
			await logout(page);
			// Try to access dashboard
			await page.goto("/");
			// Should be redirected to signin
			await e2eExpect(page).toHaveURL("/signin", { timeout: 10_000 });
		},
	);
	e2eTest(
		"should still allow access to the routines page after logout",
		async ({ page }) => {
			// Logout first
			await logout(page);
			// Public routes remain accessible without an authenticated session.
			await page.goto("/routines");
			await e2eExpect(page).toHaveURL("/routines", { timeout: 10_000 });
			await e2eExpect(
				page.getByRole("heading", { name: /^routines$/i }),
			).toBeVisible();
		},
	);
	e2eTest(
		"should still allow access to the exercises page after logout",
		async ({ page }) => {
			// Logout first
			await logout(page);
			// Public routes remain accessible without an authenticated session.
			await page.goto("/exercises");
			await e2eExpect(page).toHaveURL("/exercises", { timeout: 10_000 });
			await e2eExpect(
				page.getByRole("heading", { name: /^exercises$/i }),
			).toBeVisible();
		},
	);
	e2eTest(
		"should still allow access to the logs page after logout",
		async ({ page }) => {
			// Logout first
			await logout(page);
			// Public routes remain accessible without an authenticated session.
			await page.goto("/logs");
			await e2eExpect(page).toHaveURL("/logs", { timeout: 10_000 });
			await e2eExpect(
				page.getByRole("heading", { name: /workout logs/i }),
			).toBeVisible();
		},
	);
	e2eTest("should be able to login again after logout", async ({ page }) => {
		// Logout first
		await logout(page);
		await loginAsTestUser(page);
		// Should be back on dashboard
		await e2eExpect(page).toHaveURL("/", { timeout: 15_000 });
		await e2eExpect(page.getByText(/welcome back/i)).toBeVisible({
			timeout: 10_000,
		});
	});
});

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

async function hasAuthSessionRequest(page: Page): Promise<boolean> {
	return page.evaluate(() =>
		performance
			.getEntriesByType("resource")
			.some((entry) => entry.name.includes("/api/auth/get-session")),
	);
}

async function isOnSigninPage(page: Page): Promise<boolean> {
	try {
		return new URL(page.url()).pathname === "/signin";
	} catch {
		return false;
	}
}

async function loadSigninPage(page: Page): Promise<void> {
	const loginButton = page.getByRole("button", { name: /login/i });

	if (await isOnSigninPage(page)) {
		await page.reload({ waitUntil: "domcontentloaded" });
	} else {
		await page.goto("/signin", { waitUntil: "domcontentloaded" });
	}

	await expect(loginButton).toBeVisible({ timeout: 15_000 });
}

export async function waitForAuthPageHydration(page: Page): Promise<void> {
	const loginButton = page.getByRole("button", { name: /login/i });

	const sessionRequest = page
		.waitForResponse(
			(response) =>
				response.request().method() === "GET" &&
				response.url().includes("/api/auth/get-session"),
			{ timeout: 15_000 },
		)
		.catch(() => null);

	if (!(await hasAuthSessionRequest(page))) {
		const response = await sessionRequest;

		if (!response) {
			throw new Error("Timed out waiting for auth session hydration");
		}
	}

	await expect(loginButton).toBeVisible({
		timeout: 15_000,
	});
}
/**
 * Get test user credentials from environment
 */
export function getTestCredentials(): {
	email: string;
	password: string;
} {
	const email = process.env.ADMIN_USER;
	const password = process.env.ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error(
			"ADMIN_USER and ADMIN_PASSWORD environment variables are required",
		);
	}
	return { email, password };
}
/**
 * Authentication helper utilities for E2E tests
 */
/**
 * Login as the test user
 * Note: This is primarily for tests that need to manually log in
 * Most tests should use the auth.setup.ts storage state instead
 */
export async function loginAsTestUser(page: Page): Promise<void> {
	const { email, password } = getTestCredentials();
	await loadSigninPage(page);
	await waitForAuthPageHydration(page);
	// Fill credentials
	await page.getByLabel(/email/i).fill(email);
	await page.getByLabel(/password/i).fill(password);
	// Submit
	await page.getByRole("button", { name: /login/i }).click();
	// Wait for successful login
	await expect(page).toHaveURL("/", { timeout: 15_000 });
	await expect(page.getByText(/welcome back/i)).toBeVisible({
		timeout: 10_000,
	});
}
/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
	const userMenu = page.locator("header button:visible").last();
	await expect(userMenu).toBeVisible({ timeout: 5_000 });
	await userMenu.click();

	const logoutButton = page.getByRole("menuitem", {
		name: /logout|sign out/i,
	});
	await expect(logoutButton).toBeVisible({ timeout: 5_000 });
	await logoutButton.click();

	// Verify logged out
	await expect(page).toHaveURL("/signin", { timeout: 10_000 });
}
/**
 * Check if the user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
	try {
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		// If redirected to signin, not authenticated
		const url = page.url();
		if (url.includes("/signin")) {
			return false;
		}
		// Check for dashboard content
		const dashboard = page.getByText(/welcome back/i);
		return await dashboard.isVisible({ timeout: 5000 });
	} catch {
		return false;
	}
}
/**
 * Clear authentication state
 */
export async function clearAuth(page: Page): Promise<void> {
	await page.context().clearCookies();
	await loadSigninPage(page);
	await page.evaluate(() => {
		localStorage.clear();
		sessionStorage.clear();
	});
}

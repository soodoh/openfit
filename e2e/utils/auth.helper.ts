import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
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
  await page.goto("/signin");
  // Wait for login form
  await expect(page.getByRole("button", { name: /login/i })).toBeVisible({
    timeout: 15_000,
  });
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
  // Find and click the user menu/profile button
  const userMenu = page.getByRole("button", { name: /profile|user|menu/i });
  if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userMenu.click();
    // Click logout option
    const logoutButton = page.getByRole("menuitem", {
      name: /logout|sign out/i,
    });
    await logoutButton.click();
  } else {
    // Try direct navigation to logout
    await page.goto("/api/auth/signout");
  }
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
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

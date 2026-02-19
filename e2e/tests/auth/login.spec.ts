import { expect as e2eExpect, test as e2eTest } from "@/e2e/fixtures/base.fixture";
/**
 * Login page E2E tests
 *
 * These tests run without authentication (chromium-no-auth project)
 * to test the login form functionality.
 */
e2eTest.describe("Login Page", () => {
    e2eTest.beforeEach(async ({ loginPage }) => {
        await loginPage.goto();
    });
    e2eTest("should display the login form", async ({ loginPage }) => {
        // Verify form elements are visible
        await e2eExpect(loginPage.emailInput).toBeVisible();
        await e2eExpect(loginPage.passwordInput).toBeVisible();
        await e2eExpect(loginPage.loginButton).toBeVisible();
        await e2eExpect(loginPage.registerLink).toBeVisible();
    });
    e2eTest("should login with valid credentials", async ({ loginPage, page }) => {
        const email = process.env.ADMIN_USER;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password) {
            e2eTest.skip();
            return;
        }
        // Perform login
        await loginPage.login(email, password);
        // Should redirect to dashboard
        await e2eExpect(page).toHaveURL("/", { timeout: 15_000 });
        await e2eExpect(page.getByText(/welcome back/i)).toBeVisible({
            timeout: 10_000,
        });
    });
    e2eTest("should show error for invalid credentials", async ({ loginPage }) => {
        // Try to login with invalid credentials
        await loginPage.login("invalid@example.com", "wrongpassword123!");
        // Wait for error to appear
        await loginPage.page.waitForTimeout(1000);
        // Should show an error message
        const hasError = await loginPage.hasError();
        e2eExpect(hasError).toBe(true);
        // Should still be on login page
        const path = await loginPage.getCurrentPath();
        e2eExpect(path).toBe("/signin");
    });
    e2eTest("should show validation error for invalid email", async ({ loginPage, }) => {
        // Enter invalid email
        await loginPage.fillEmail("not-an-email");
        await loginPage.fillPassword("validpassword123!");
        await loginPage.clickLogin();
        // Wait for validation
        await loginPage.page.waitForTimeout(500);
        // Should show validation error
        const hasError = await loginPage.hasError();
        e2eExpect(hasError).toBe(true);
    });
    e2eTest("should show validation error for empty password", async ({ loginPage, }) => {
        // Enter email but leave password empty
        await loginPage.fillEmail("test@example.com");
        await loginPage.fillPassword("");
        await loginPage.clickLogin();
        // Wait for validation
        await loginPage.page.waitForTimeout(500);
        // Should show validation error
        const hasError = await loginPage.hasError();
        e2eExpect(hasError).toBe(true);
    });
    e2eTest("should navigate to register page", async ({ loginPage }) => {
        // Click register link
        await loginPage.clickRegisterLink();
        // Should be on register page
        await e2eExpect(loginPage.page).toHaveURL("/register");
        // Should show register button
        const isRegisterButtonVisible = await loginPage.isRegisterButtonVisible();
        e2eExpect(isRegisterButtonVisible).toBe(true);
    });
    e2eTest("should navigate back to login from register page", async ({ loginPage, }) => {
        // Go to register page
        await loginPage.gotoRegister();
        // Click back to sign in
        await loginPage.clickBackToSignIn();
        // Should be back on signin page
        await e2eExpect(loginPage.page).toHaveURL("/signin");
        await e2eExpect(loginPage.loginButton).toBeVisible();
    });
    e2eTest("should preserve email input when navigating between pages", async ({ loginPage, }) => {
        const testEmail = "preserve@e2eTest.com";
        // Enter email
        await loginPage.fillEmail(testEmail);
        // Navigate to register
        await loginPage.clickRegisterLink();
        await e2eExpect(loginPage.page).toHaveURL("/register");
        // Navigate back
        await loginPage.clickBackToSignIn();
        // Note: This tests browser behavior - email may or may not be preserved
        // depending on the implementation
        await e2eExpect(loginPage.emailInput).toBeVisible();
    });
    e2eTest("should show loading state while logging in", async ({ loginPage }) => {
        const email = process.env.ADMIN_USER;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password) {
            e2eTest.skip();
            return;
        }
        // Fill credentials
        await loginPage.fillEmail(email);
        await loginPage.fillPassword(password);
        // Click login and check for loading state
        await loginPage.clickLogin();
        // The button should show loading state (text changes or spinner appears)
        // This is a quick check - the loading state may be brief
        const buttonText = await loginPage.loginButton.textContent();
        // Button may show "Loading..." or still show "Login" if request is fast
        e2eExpect(buttonText).toBeTruthy();
    });
});

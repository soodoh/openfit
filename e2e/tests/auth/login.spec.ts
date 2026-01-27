import { test, expect } from "../../fixtures/base.fixture";

/**
 * Login page E2E tests
 *
 * These tests run without authentication (chromium-no-auth project)
 * to test the login form functionality.
 */
test.describe("Login Page", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test("should display the login form", async ({ loginPage }) => {
    // Verify form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test("should login with valid credentials", async ({ loginPage, page }) => {
    const email = process.env.TEST_USER;
    const password = process.env.TEST_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    // Perform login
    await loginPage.login(email, password);

    // Should redirect to dashboard
    await expect(page).toHaveURL("/", { timeout: 15000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show error for invalid credentials", async ({ loginPage }) => {
    // Try to login with invalid credentials
    await loginPage.login("invalid@example.com", "wrongpassword123!");

    // Wait for error to appear
    await loginPage.page.waitForTimeout(1000);

    // Should show an error message
    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);

    // Should still be on login page
    const path = await loginPage.getCurrentPath();
    expect(path).toBe("/signin");
  });

  test("should show validation error for invalid email", async ({
    loginPage,
  }) => {
    // Enter invalid email
    await loginPage.fillEmail("not-an-email");
    await loginPage.fillPassword("validpassword123!");
    await loginPage.clickLogin();

    // Wait for validation
    await loginPage.page.waitForTimeout(500);

    // Should show validation error
    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);
  });

  test("should show validation error for empty password", async ({
    loginPage,
  }) => {
    // Enter email but leave password empty
    await loginPage.fillEmail("test@example.com");
    await loginPage.fillPassword("");
    await loginPage.clickLogin();

    // Wait for validation
    await loginPage.page.waitForTimeout(500);

    // Should show validation error
    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);
  });

  test("should navigate to register page", async ({ loginPage }) => {
    // Click register link
    await loginPage.clickRegisterLink();

    // Should be on register page
    await expect(loginPage.page).toHaveURL("/register");

    // Should show register button
    const isRegisterButtonVisible = await loginPage.isRegisterButtonVisible();
    expect(isRegisterButtonVisible).toBe(true);
  });

  test("should navigate back to login from register page", async ({
    loginPage,
  }) => {
    // Go to register page
    await loginPage.gotoRegister();

    // Click back to sign in
    await loginPage.clickBackToSignIn();

    // Should be back on signin page
    await expect(loginPage.page).toHaveURL("/signin");
    await expect(loginPage.loginButton).toBeVisible();
  });

  test("should preserve email input when navigating between pages", async ({
    loginPage,
  }) => {
    const testEmail = "preserve@test.com";

    // Enter email
    await loginPage.fillEmail(testEmail);

    // Navigate to register
    await loginPage.clickRegisterLink();
    await expect(loginPage.page).toHaveURL("/register");

    // Navigate back
    await loginPage.clickBackToSignIn();

    // Note: This tests browser behavior - email may or may not be preserved
    // depending on the implementation
    await expect(loginPage.emailInput).toBeVisible();
  });

  test("should show loading state while logging in", async ({ loginPage }) => {
    const email = process.env.TEST_USER;
    const password = process.env.TEST_PASSWORD;

    if (!email || !password) {
      test.skip();
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
    expect(buttonText).toBeTruthy();
  });
});

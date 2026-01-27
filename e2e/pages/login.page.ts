import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page object for the Login/Register pages
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly backToSignInLink: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.loginButton = page.getByRole("button", { name: /login/i });
    this.registerLink = page.getByRole("link", { name: /create an account/i });
    this.backToSignInLink = page.getByRole("link", {
      name: /back to sign in/i,
    });
    this.emailError = page.locator("text=Invalid email");
    this.passwordError = page.locator(".text-destructive");
  }

  /**
   * Navigate to the sign in page
   */
  async goto(): Promise<void> {
    await this.navigateTo("/signin");
    await this.waitForFormReady();
  }

  /**
   * Navigate to the register page
   */
  async gotoRegister(): Promise<void> {
    await this.navigateTo("/register");
    await this.waitForFormReady();
  }

  /**
   * Wait for the login form to be ready
   */
  async waitForFormReady(): Promise<void> {
    await this.waitForLoadingComplete();
    await expect(this.emailInput).toBeVisible({ timeout: 15000 });
    await expect(this.loginButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * Fill in the email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill in the password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the login button
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Perform a complete login
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Check if login form is displayed
   */
  async isLoginFormVisible(): Promise<boolean> {
    return this.isVisible(this.loginButton);
  }

  /**
   * Get the email validation error message
   */
  async getEmailError(): Promise<string | null> {
    const errorLocator = this.page.locator(".text-destructive").first();
    if (await this.isVisible(errorLocator, 2000)) {
      return await errorLocator.textContent();
    }
    return null;
  }

  /**
   * Get the password/general error message
   */
  async getPasswordError(): Promise<string | null> {
    const errorLocator = this.page
      .locator(".space-y-2")
      .filter({ hasText: /password/i })
      .locator(".text-destructive");
    if (await this.isVisible(errorLocator, 2000)) {
      return await errorLocator.textContent();
    }
    return null;
  }

  /**
   * Check if any error message is displayed
   */
  async hasError(): Promise<boolean> {
    return this.isVisible(this.page.locator(".text-destructive").first(), 2000);
  }

  /**
   * Click the register link
   */
  async clickRegisterLink(): Promise<void> {
    await this.clickAndNavigate(this.registerLink);
  }

  /**
   * Click back to sign in link (from register page)
   */
  async clickBackToSignIn(): Promise<void> {
    await this.clickAndNavigate(this.backToSignInLink);
  }

  /**
   * Check if we're on the register page
   */
  async isRegisterPage(): Promise<boolean> {
    const path = await this.getCurrentPath();
    return path === "/register";
  }

  /**
   * Check if the register button is visible (indicates register page)
   */
  async isRegisterButtonVisible(): Promise<boolean> {
    return this.isVisible(this.page.getByRole("button", { name: /register/i }));
  }
}

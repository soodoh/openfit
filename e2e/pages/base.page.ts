import { Page, Locator, expect } from "@playwright/test";

/**
 * Base page object with common utilities for all pages
 */
export class BasePage {
  readonly page: Page;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadingSpinner = page.locator(".animate-spin");
  }

  /**
   * Navigate to a specific path
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to finish loading
   * Waits for network to be idle and no loading spinners visible
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for any loading indicators to disappear
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for Convex real-time updates to settle
    await this.page.waitForLoadState("domcontentloaded");

    // Wait for any loading spinners to disappear
    const spinner = this.page.locator(".animate-spin").first();
    if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(spinner).toBeHidden({ timeout: 15000 });
    }

    // Additional wait for "Loading..." text
    const loadingText = this.page.getByText(/^loading\.\.\.$/i).first();
    if (await loadingText.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(loadingText).toBeHidden({ timeout: 15000 });
    }
  }

  /**
   * Wait for Convex real-time data to load
   */
  async waitForConvexData(timeout = 10000): Promise<void> {
    // Convex uses real-time subscriptions, so we need to wait for initial data
    await this.page.waitForTimeout(500);
    await this.waitForLoadingComplete();
  }

  /**
   * Get the current URL path (without base URL)
   */
  async getCurrentPath(): Promise<string> {
    const url = new URL(this.page.url());
    return url.pathname;
  }

  /**
   * Check if an element is visible
   */
  async isVisible(locator: Locator, timeout = 5000): Promise<boolean> {
    try {
      await expect(locator).toBeVisible({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click and wait for navigation
   */
  async clickAndNavigate(locator: Locator): Promise<void> {
    await Promise.all([this.page.waitForURL("**/*"), locator.click()]);
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }
}

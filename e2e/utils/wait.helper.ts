import { expect, Locator, Page } from "@playwright/test";

/**
 * Wait utilities for handling Convex real-time updates and async operations
 */

/**
 * Default timeout for Convex data operations
 */
const DEFAULT_CONVEX_TIMEOUT = 10000;

/**
 * Wait for Convex real-time data to load
 * Convex uses WebSocket subscriptions, so we need to wait for initial data
 */
export async function waitForConvexReady(
  page: Page,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  // Wait for any loading spinners to disappear
  const spinner = page.locator(".animate-spin").first();
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await expect(spinner).toBeHidden({ timeout });
  }

  // Wait for "Loading..." text to disappear
  const loadingText = page.getByText(/^loading\.\.\.$/i).first();
  if (await loadingText.isVisible({ timeout: 500 }).catch(() => false)) {
    await expect(loadingText).toBeHidden({ timeout });
  }

  // Small additional wait for WebSocket data
  await page.waitForTimeout(300);
}

/**
 * Wait for a mutation to complete
 * Use after triggering a Convex mutation to wait for the update
 */
export async function waitForMutation(
  page: Page,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  // Wait for network to settle
  await page.waitForLoadState("networkidle");

  // Wait for any loading indicators
  await waitForConvexReady(page, timeout);
}

/**
 * Wait for an element to appear with Convex data
 */
export async function waitForElement(
  locator: Locator,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  await expect(locator).toBeVisible({ timeout });
}

/**
 * Wait for an element to disappear
 */
export async function waitForElementHidden(
  locator: Locator,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  await expect(locator).toBeHidden({ timeout });
}

/**
 * Wait for element count to change
 */
export async function waitForCountChange(
  locator: Locator,
  expectedCount: number,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  await expect(locator).toHaveCount(expectedCount, { timeout });
}

/**
 * Wait for text content to appear
 */
export async function waitForText(
  page: Page,
  text: string | RegExp,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  if (typeof text === "string") {
    await expect(page.getByText(text)).toBeVisible({ timeout });
  } else {
    await expect(page.locator(`text=${text.source}`)).toBeVisible({ timeout });
  }
}

/**
 * Wait for URL to change
 */
export async function waitForUrl(
  page: Page,
  url: string | RegExp,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  await expect(page).toHaveURL(url, { timeout });
}

/**
 * Wait for modal to open
 */
export async function waitForModalOpen(
  page: Page,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  await expect(page.getByRole("dialog")).toBeVisible({ timeout });
}

/**
 * Wait for modal to close
 */
export async function waitForModalClose(
  page: Page,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  await expect(page.getByRole("dialog")).toBeHidden({ timeout });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(
  page: Page,
  message?: string | RegExp,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  const toastLocator = message
    ? page.locator("[class*='toast']").filter({ hasText: message })
    : page.locator("[class*='toast']");

  await expect(toastLocator.first()).toBeVisible({ timeout });
}

/**
 * Wait for toast to disappear
 */
export async function waitForToastDismiss(
  page: Page,
  timeout = DEFAULT_CONVEX_TIMEOUT,
): Promise<void> {
  await expect(page.locator("[class*='toast']")).toBeHidden({ timeout });
}

/**
 * Retry an action until it succeeds or timeout
 */
export async function retryUntilSuccess<T>(
  action: () => Promise<T>,
  options: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  } = {},
): Promise<T> {
  const {
    timeout = DEFAULT_CONVEX_TIMEOUT,
    interval = 500,
    errorMessage = "Action did not succeed within timeout",
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      return await action();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new Error(errorMessage);
}

/**
 * Wait for debounced input (e.g., search)
 */
export async function waitForDebounce(
  page: Page,
  debounceMs = 350,
): Promise<void> {
  await page.waitForTimeout(debounceMs + 50);
}

/**
 * Poll until condition is met
 */
export async function pollUntil(
  condition: () => Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  } = {},
): Promise<void> {
  const {
    timeout = DEFAULT_CONVEX_TIMEOUT,
    interval = 200,
    errorMessage = "Condition not met within timeout",
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(errorMessage);
}

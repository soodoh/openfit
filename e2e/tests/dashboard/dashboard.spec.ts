import { expect, test } from "@/e2e/fixtures/base.fixture";

/**
 * Dashboard E2E tests
 *
 * Tests for the main dashboard page (authenticated home page).
 */
test.describe("Dashboard", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("should display welcome message", async ({ dashboardPage }) => {
    await expect(dashboardPage.welcomeHeading).toBeVisible();
    await expect(dashboardPage.welcomeSubtext).toBeVisible();
  });

  test("should display stats cards", async ({ dashboardPage, page }) => {
    // Wait for data to load
    await dashboardPage.waitForConvexData();

    // Check that stats section exists
    // Look for stat card labels
    await expect(page.getByText(/total sessions/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/this week/i)).toBeVisible();
    await expect(page.getByText(/day streak/i)).toBeVisible();
    await expect(page.getByText(/^routines$/i).first()).toBeVisible();
  });

  test("should display quick access cards", async ({ dashboardPage }) => {
    // Wait for page to load
    await dashboardPage.waitForConvexData();

    // Check quick access section
    await expect(
      dashboardPage.page.getByRole("heading", { name: /quick access/i }),
    ).toBeVisible();

    // Verify links exist
    await expect(
      dashboardPage.page.getByRole("link", { name: /routines/i }).first(),
    ).toBeVisible();
    await expect(
      dashboardPage.page.getByRole("link", { name: /exercises/i }).first(),
    ).toBeVisible();
    await expect(
      dashboardPage.page.getByRole("link", { name: /workout logs/i }).first(),
    ).toBeVisible();
  });

  test("should navigate to routines page from quick access", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.waitForConvexData();

    // Click routines card
    const routinesLink = page
      .getByRole("link", { name: /routines/i })
      .filter({ hasText: /create and manage/i });
    await routinesLink.click();

    // Should be on routines page
    await expect(page).toHaveURL("/routines");
    await expect(
      page.getByRole("heading", { name: /^routines$/i }),
    ).toBeVisible();
  });

  test("should navigate to exercises page from quick access", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.waitForConvexData();

    // Click exercises card
    const exercisesLink = page
      .getByRole("link", { name: /exercises/i })
      .filter({ hasText: /browse the exercise library/i });
    await exercisesLink.click();

    // Should be on exercises page
    await expect(page).toHaveURL("/exercises");
    await expect(
      page.getByRole("heading", { name: /^exercises$/i }),
    ).toBeVisible();
  });

  test("should navigate to logs page from quick access", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.waitForConvexData();

    // Click logs card
    const logsLink = page
      .getByRole("link", { name: /workout logs/i })
      .filter({ hasText: /review your past sessions/i });
    await logsLink.click();

    // Should be on logs page
    await expect(page).toHaveURL("/logs");
    await expect(
      page.getByRole("heading", { name: /workout logs/i }),
    ).toBeVisible();
  });

  test("should display recent activity section", async ({ dashboardPage }) => {
    await expect(dashboardPage.recentActivityHeading).toBeVisible();
  });

  test("should open new session modal when clicking new session button", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.waitForConvexData();

    // Click new session button
    await dashboardPage.clickNewSession();

    // Modal should be open
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  });

  test("should close modal when pressing escape", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.waitForConvexData();

    // Open modal
    await dashboardPage.clickNewSession();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Press escape
    await page.keyboard.press("Escape");

    // Modal should be closed
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
  });

  test("should show empty state or recent sessions", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.waitForConvexData();

    // Either empty state or session cards should be visible
    const emptyState = page.getByText(/no workouts yet/i);
    const sessionCards = page.locator('[class*="cursor-pointer"]');

    const hasEmpty = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const hasCards = await sessionCards
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // One of them should be visible
    expect(hasEmpty || hasCards).toBe(true);
  });

  test("should navigate to logs when clicking view all", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.waitForConvexData();

    // View all link is only visible when there are sessions
    const viewAllLink = page.getByRole("link", { name: /view all/i });
    const isVisible = await viewAllLink
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      await viewAllLink.click();
      await expect(page).toHaveURL("/logs");
    } else {
      // If no sessions, that's okay - skip this assertion
      test.skip();
    }
  });

  test("should have functioning navigation header", async ({
    dashboardPage,
    page,
  }) => {
    // Check for navigation elements
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
  });
});

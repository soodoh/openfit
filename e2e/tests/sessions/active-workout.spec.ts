import { test, expect } from "../../fixtures/base.fixture";

/**
 * Active Workout Session E2E tests
 */
test.describe("Active Workout", () => {
  test.beforeEach(async ({ workoutPage }) => {
    await workoutPage.goto();
  });

  test("should display workout page", async ({ workoutPage, page }) => {
    await workoutPage.waitForConvexData();

    // Should show either no active session or active session content
    const hasNoSession = await workoutPage.hasNoActiveSession();
    const hasSession = await workoutPage.hasActiveSession();

    expect(hasNoSession || hasSession).toBe(true);
  });

  test("should show no active session state when appropriate", async ({
    workoutPage,
  }) => {
    await workoutPage.waitForConvexData();

    const hasNoSession = await workoutPage.hasNoActiveSession();

    if (hasNoSession) {
      // Should show the empty state
      await expect(workoutPage.pageHeading).toBeVisible();
      await expect(workoutPage.noActiveSessionMessage).toBeVisible();
      await expect(workoutPage.startNewWorkoutButton).toBeVisible();
      await expect(workoutPage.backToDashboardButton).toBeVisible();
    }
  });

  test("should show start new workout button when no active session", async ({
    workoutPage,
  }) => {
    await workoutPage.waitForConvexData();

    const hasNoSession = await workoutPage.hasNoActiveSession();

    if (hasNoSession) {
      await expect(workoutPage.startNewWorkoutButton).toBeVisible();
    }
  });

  test("should navigate back to dashboard from empty state", async ({
    workoutPage,
    page,
  }) => {
    await workoutPage.waitForConvexData();

    const hasNoSession = await workoutPage.hasNoActiveSession();

    if (hasNoSession) {
      await workoutPage.clickBackToDashboard();
      await expect(page).toHaveURL("/");
    }
  });

  test("should open new session modal from empty state", async ({
    workoutPage,
    page,
  }) => {
    await workoutPage.waitForConvexData();

    const hasNoSession = await workoutPage.hasNoActiveSession();

    if (hasNoSession) {
      await workoutPage.clickStartNewWorkout();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    }
  });

  test("should show active session when one exists", async ({
    workoutPage,
    dashboardPage,
    page,
  }) => {
    // First, check if there's a current session from dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForConvexData();

    const hasActiveSession = await dashboardPage.hasActiveSession();

    if (hasActiveSession) {
      // Navigate to workout page
      await workoutPage.goto();
      await workoutPage.waitForConvexData();

      // Should not show "no active workout" message
      const hasNoSession = await workoutPage.hasNoActiveSession();
      expect(hasNoSession).toBe(false);
    } else {
      // No active session - create one first or skip
      test.skip();
    }
  });

  test("should be able to close modal without creating session", async ({
    workoutPage,
    page,
  }) => {
    await workoutPage.waitForConvexData();

    const hasNoSession = await workoutPage.hasNoActiveSession();

    if (hasNoSession) {
      // Open modal
      await workoutPage.clickStartNewWorkout();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

      // Close without creating
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });

      // Should still show no active session
      const stillNoSession = await workoutPage.hasNoActiveSession();
      expect(stillNoSession).toBe(true);
    }
  });

  test("should resume active session from dashboard", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForConvexData();

    const hasActiveSession = await dashboardPage.hasActiveSession();

    if (hasActiveSession) {
      // Click resume
      await dashboardPage.clickResumeSession();

      // Should navigate to workout page
      await expect(page).toHaveURL("/workout");
    } else {
      test.skip();
    }
  });
});

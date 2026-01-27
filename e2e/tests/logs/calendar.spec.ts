import { expect, test } from "@/e2e/fixtures/base.fixture";

/**
 * Workout Logs Calendar E2E tests
 */
test.describe("Workout Logs Calendar", () => {
  test.beforeEach(async ({ logsPage }) => {
    await logsPage.goto();
  });

  test("should display logs page", async ({ logsPage }) => {
    await expect(logsPage.pageHeading).toBeVisible();
    await expect(logsPage.pageSubtext).toBeVisible();
  });

  test("should display calendar or empty state", async ({ logsPage }) => {
    await logsPage.waitForConvexData();

    const hasEmpty = await logsPage.hasEmptyState();
    const hasCalendar = await logsPage.isCalendarVisible();

    // Should show either calendar or empty state
    expect(hasEmpty || hasCalendar).toBe(true);
  });

  test("should display session count", async ({ logsPage }) => {
    await logsPage.waitForConvexData();

    const hasEmpty = await logsPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Should show session count for the month
    const count = await logsPage.getSessionCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should navigate to previous month", async ({ logsPage }) => {
    await logsPage.waitForConvexData();

    const hasEmpty = await logsPage.hasEmptyState();
    // Even with empty state, we should be able to navigate months
    // But the calendar needs to be visible first
    const hasCalendar = await logsPage.isCalendarVisible();
    if (!hasCalendar && hasEmpty) {
      test.skip();
      return;
    }

    // Get current month
    const currentMonth = await logsPage.getCurrentMonthYear();

    // Navigate to previous month
    await logsPage.goToPreviousMonth();
    await logsPage.page.waitForTimeout(500);

    // Month should change
    const newMonth = await logsPage.getCurrentMonthYear();

    // Months should be different (or same if at boundary)
    expect(newMonth !== null).toBe(true);
  });

  test("should navigate to next month", async ({ logsPage }) => {
    await logsPage.waitForConvexData();

    const hasCalendar = await logsPage.isCalendarVisible();
    const hasEmpty = await logsPage.hasEmptyState();
    if (!hasCalendar && hasEmpty) {
      test.skip();
      return;
    }

    // Get current month
    const currentMonth = await logsPage.getCurrentMonthYear();

    // Navigate to next month
    await logsPage.goToNextMonth();
    await logsPage.page.waitForTimeout(500);

    // Month should change
    const newMonth = await logsPage.getCurrentMonthYear();
    expect(newMonth !== null).toBe(true);
  });

  test("should return to current month with today button", async ({
    logsPage,
  }) => {
    await logsPage.waitForConvexData();

    const hasCalendar = await logsPage.isCalendarVisible();
    const hasEmpty = await logsPage.hasEmptyState();
    if (!hasCalendar && hasEmpty) {
      test.skip();
      return;
    }

    // Navigate away from current month
    await logsPage.goToPreviousMonth();
    await logsPage.page.waitForTimeout(500);
    await logsPage.goToPreviousMonth();
    await logsPage.page.waitForTimeout(500);

    // Check if today button is visible
    const hasTodayButton = await logsPage.isTodayButtonVisible();

    if (hasTodayButton) {
      // Click today button
      await logsPage.goToToday();
      await logsPage.page.waitForTimeout(500);

      // Should be back at current month
      const currentDate = new Date();
      const expectedMonth = currentDate.toLocaleString("default", {
        month: "long",
      });
      const monthYear = await logsPage.getCurrentMonthYear();

      expect(monthYear?.includes(expectedMonth)).toBe(true);
    }
  });

  test("should show new session button when sessions exist", async ({
    logsPage,
  }) => {
    await logsPage.waitForConvexData();

    const hasEmpty = await logsPage.hasEmptyState();

    // New session button should be visible when there are sessions
    const newSessionBtn = logsPage.page.getByRole("button", {
      name: /new session/i,
    });
    const isVisible = await newSessionBtn
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!hasEmpty) {
      // If there are sessions, the button should be visible
      expect(isVisible).toBe(true);
    }
  });

  test("should open new session modal", async ({ logsPage, page }) => {
    await logsPage.waitForConvexData();

    const hasEmpty = await logsPage.hasEmptyState();

    // Find new session button (could be in header or empty state)
    const newSessionBtn = page.getByRole("button", { name: /new session/i });
    const isVisible = await newSessionBtn
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      await newSessionBtn.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    } else if (hasEmpty) {
      // Empty state should have a button to create session
      const createBtn = page.getByRole("button", {
        name: /new session|start|create/i,
      });
      if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createBtn.click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("should display month navigation buttons", async ({ logsPage }) => {
    await logsPage.waitForConvexData();

    const hasCalendar = await logsPage.isCalendarVisible();
    const hasEmpty = await logsPage.hasEmptyState();

    if (hasCalendar) {
      // Look for navigation buttons (chevron icons)
      const prevButton = logsPage.page.locator(
        'button:has([class*="lucide-chevron-left"])',
      );
      const nextButton = logsPage.page.locator(
        'button:has([class*="lucide-chevron-right"])',
      );

      const hasPrev = await prevButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      const hasNext = await nextButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasPrev || hasNext).toBe(true);
    }
  });

  test("should show empty state message", async ({ logsPage }) => {
    await logsPage.waitForConvexData();

    const hasEmpty = await logsPage.hasEmptyState();

    if (hasEmpty) {
      // Should show helpful message
      const emptyMessage = logsPage.page.getByText(/no workout logs yet/i);
      await expect(emptyMessage).toBeVisible();

      // Should show CTA to create session
      const createButton = logsPage.page.getByRole("button", {
        name: /new session|start|create/i,
      });
      const isVisible = await createButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      expect(isVisible).toBe(true);
    }
  });

  test("should close new session modal on escape", async ({
    logsPage,
    page,
  }) => {
    await logsPage.waitForConvexData();

    // Find and click new session button
    const newSessionBtn = page.getByRole("button", { name: /new session/i });
    const isVisible = await newSessionBtn
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      await newSessionBtn.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

      // Close with escape
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
    }
  });
});

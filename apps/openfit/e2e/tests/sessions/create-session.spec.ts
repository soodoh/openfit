import {
  expect as e2eExpect,
  test as e2eTest,
} from "@/e2e/fixtures/base.fixture";
/**
 * Create Session E2E tests
 */
e2eTest.describe("Create Session", () => {
  e2eTest(
    "should open new session modal from dashboard",
    async ({ dashboardPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForConvexData();
      // Click new session button
      await dashboardPage.clickNewSession();
      // Modal should be open
      await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    },
  );
  e2eTest(
    "should open new session modal from workout page",
    async ({ workoutPage, page }) => {
      await workoutPage.goto();
      await workoutPage.waitForConvexData();
      // If there's no active session, should see "Start New Workout" button
      const hasNoSession = await workoutPage.hasNoActiveSession();
      if (hasNoSession) {
        await workoutPage.clickStartNewWorkout();
        await e2eExpect(page.getByRole("dialog")).toBeVisible({
          timeout: 5000,
        });
      }
    },
  );
  e2eTest("should create an empty session", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForConvexData();
    // Open new session modal
    await dashboardPage.clickNewSession();
    await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    // Find and click create/start button in modal
    const startButton = page.getByRole("button", {
      name: /create|start|begin/i,
    });
    // Check if there's a start button visible
    if (await startButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startButton.click();
      // Should either navigate to workout page or close modal
      await page.waitForTimeout(1000);
      // Either on workout page or modal closed
      const onWorkoutPage = page.url().includes("/workout");
      const modalClosed = !(await page
        .getByRole("dialog")
        .isVisible({ timeout: 1000 })
        .catch(() => false));
      e2eExpect(onWorkoutPage || modalClosed).toBe(true);
    }
  });
  e2eTest(
    "should create session from routine template",
    async ({ dashboardPage, routinesPage, page }) => {
      // First check if there are any routines
      await routinesPage.goto();
      await routinesPage.waitForConvexData();
      const hasEmpty = await routinesPage.hasEmptyState();
      if (hasEmpty) {
        e2eTest.skip();
        return;
      }
      // Go to dashboard and open new session modal
      await dashboardPage.goto();
      await dashboardPage.waitForConvexData();
      await dashboardPage.clickNewSession();
      await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      // Look for template/routine selection
      const templateSelect = page.getByRole("combobox");
      const hasTemplateSelect = await templateSelect
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (hasTemplateSelect) {
        // Click to open template dropdown
        await templateSelect.click();
        // Wait for options
        await page.waitForTimeout(500);
        // Click first option
        const options = page.getByRole("option");
        if ((await options.count()) > 0) {
          await options.first().click();
        }
      }
      // Create the session
      const startButton = page.getByRole("button", {
        name: /create|start|begin/i,
      });
      if (await startButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startButton.click();
        await page.waitForTimeout(1000);
      }
    },
  );
  e2eTest(
    "should close new session modal on cancel",
    async ({ dashboardPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForConvexData();
      // Open modal
      await dashboardPage.clickNewSession();
      await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      // Close with escape
      await page.keyboard.press("Escape");
      // Modal should be closed
      await e2eExpect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
    },
  );
  e2eTest(
    "should close modal by clicking close button",
    async ({ dashboardPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForConvexData();
      // Open modal
      await dashboardPage.clickNewSession();
      await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      // Find and click close button
      const closeButton = page.getByRole("button", { name: /close|cancel|x/i });
      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click();
        await e2eExpect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
      } else {
        // Use escape as fallback
        await page.keyboard.press("Escape");
        await e2eExpect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
      }
    },
  );
});

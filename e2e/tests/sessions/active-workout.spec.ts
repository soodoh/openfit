import { expect as e2eExpect, test as e2eTest } from "@/e2e/fixtures/base.fixture";
/**
 * Active Workout Session E2E tests
 */
e2eTest.describe("Active Workout", () => {
    e2eTest.beforeEach(async ({ workoutPage }) => {
        await workoutPage.goto();
    });
    e2eTest("should display workout page", async ({ workoutPage }) => {
        await workoutPage.waitForConvexData();
        // Should show either no active session or active session content
        const hasNoSession = await workoutPage.hasNoActiveSession();
        const hasSession = await workoutPage.hasActiveSession();
        e2eExpect(hasNoSession || hasSession).toBe(true);
    });
    e2eTest("should show no active session state when appropriate", async ({ workoutPage, }) => {
        await workoutPage.waitForConvexData();
        const hasNoSession = await workoutPage.hasNoActiveSession();
        if (hasNoSession) {
            // Should show the empty state
            await e2eExpect(workoutPage.pageHeading).toBeVisible();
            await e2eExpect(workoutPage.noActiveSessionMessage).toBeVisible();
            await e2eExpect(workoutPage.startNewWorkoutButton).toBeVisible();
            await e2eExpect(workoutPage.backToDashboardButton).toBeVisible();
        }
    });
    e2eTest("should show start new workout button when no active session", async ({ workoutPage, }) => {
        await workoutPage.waitForConvexData();
        const hasNoSession = await workoutPage.hasNoActiveSession();
        if (hasNoSession) {
            await e2eExpect(workoutPage.startNewWorkoutButton).toBeVisible();
        }
    });
    e2eTest("should navigate back to dashboard from empty state", async ({ workoutPage, page, }) => {
        await workoutPage.waitForConvexData();
        const hasNoSession = await workoutPage.hasNoActiveSession();
        if (hasNoSession) {
            await workoutPage.clickBackToDashboard();
            await e2eExpect(page).toHaveURL("/");
        }
    });
    e2eTest("should open new session modal from empty state", async ({ workoutPage, page, }) => {
        await workoutPage.waitForConvexData();
        const hasNoSession = await workoutPage.hasNoActiveSession();
        if (hasNoSession) {
            await workoutPage.clickStartNewWorkout();
            await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        }
    });
    e2eTest("should show active session when one exists", async ({ workoutPage, dashboardPage, }) => {
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
            e2eExpect(hasNoSession).toBe(false);
        }
        else {
            // No active session - create one first or skip
            e2eTest.skip();
        }
    });
    e2eTest("should be able to close modal without creating session", async ({ workoutPage, page, }) => {
        await workoutPage.waitForConvexData();
        const hasNoSession = await workoutPage.hasNoActiveSession();
        if (hasNoSession) {
            // Open modal
            await workoutPage.clickStartNewWorkout();
            await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
            // Close without creating
            await page.keyboard.press("Escape");
            await e2eExpect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
            // Should still show no active session
            const stillNoSession = await workoutPage.hasNoActiveSession();
            e2eExpect(stillNoSession).toBe(true);
        }
    });
    e2eTest("should resume active session from dashboard", async ({ dashboardPage, page, }) => {
        await dashboardPage.goto();
        await dashboardPage.waitForConvexData();
        const hasActiveSession = await dashboardPage.hasActiveSession();
        if (hasActiveSession) {
            // Click resume
            await dashboardPage.clickResumeSession();
            // Should navigate to workout page
            await e2eExpect(page).toHaveURL("/workout");
        }
        else {
            e2eTest.skip();
        }
    });
});

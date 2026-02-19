import { DashboardPage } from "@/e2e/pages/dashboard.page";
import { ExercisesPage } from "@/e2e/pages/exercises.page";
import { LoginPage } from "@/e2e/pages/login.page";
import { LogsPage } from "@/e2e/pages/logs.page";
import { RoutinesPage } from "@/e2e/pages/routines.page";
import { WorkoutPage } from "@/e2e/pages/workout.page";
import { test as base } from "@playwright/test";
/**
 * Type definitions for page fixtures
 */
export type PageFixtures = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    routinesPage: RoutinesPage;
    exercisesPage: ExercisesPage;
    workoutPage: WorkoutPage;
    logsPage: LogsPage;
};
/**
 * Extended test fixture with all page objects pre-instantiated
 *
 * Usage:
 * ```typescript
 * import { test, expect } from "@/e2e/fixtures/base.fixture";
 *
 * test("example test", async ({ dashboardPage }) => {
 *   await dashboardPage.goto();
 *   await expect(dashboardPage.welcomeHeading).toBeVisible();
 * });
 * ```
 */
export const test = base.extend<PageFixtures>({
    loginPage: async ({ page }, applyFixture) => {
        const loginPage = new LoginPage(page);
        await applyFixture(loginPage);
    },
    dashboardPage: async ({ page }, applyFixture) => {
        const dashboardPage = new DashboardPage(page);
        await applyFixture(dashboardPage);
    },
    routinesPage: async ({ page }, applyFixture) => {
        const routinesPage = new RoutinesPage(page);
        await applyFixture(routinesPage);
    },
    exercisesPage: async ({ page }, applyFixture) => {
        const exercisesPage = new ExercisesPage(page);
        await applyFixture(exercisesPage);
    },
    workoutPage: async ({ page }, applyFixture) => {
        const workoutPage = new WorkoutPage(page);
        await applyFixture(workoutPage);
    },
    logsPage: async ({ page }, applyFixture) => {
        const logsPage = new LogsPage(page);
        await applyFixture(logsPage);
    },
});
// Re-export expect for convenience
export { expect } from "@playwright/test";

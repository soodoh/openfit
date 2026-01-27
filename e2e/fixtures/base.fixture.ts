import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { DashboardPage } from "../pages/dashboard.page";
import { RoutinesPage } from "../pages/routines.page";
import { ExercisesPage } from "../pages/exercises.page";
import { WorkoutPage } from "../pages/workout.page";
import { LogsPage } from "../pages/logs.page";

/**
 * Type definitions for page fixtures
 */
export interface PageFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  routinesPage: RoutinesPage;
  exercisesPage: ExercisesPage;
  workoutPage: WorkoutPage;
  logsPage: LogsPage;
}

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
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  routinesPage: async ({ page }, use) => {
    const routinesPage = new RoutinesPage(page);
    await use(routinesPage);
  },

  exercisesPage: async ({ page }, use) => {
    const exercisesPage = new ExercisesPage(page);
    await use(exercisesPage);
  },

  workoutPage: async ({ page }, use) => {
    const workoutPage = new WorkoutPage(page);
    await use(workoutPage);
  },

  logsPage: async ({ page }, use) => {
    const logsPage = new LogsPage(page);
    await use(logsPage);
  },
});

// Re-export expect for convenience
export { expect } from "@playwright/test";

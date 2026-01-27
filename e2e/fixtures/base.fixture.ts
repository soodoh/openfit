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

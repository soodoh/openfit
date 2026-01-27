import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page object for the Dashboard (home) page
 */
export class DashboardPage extends BasePage {
  readonly welcomeHeading: Locator;
  readonly welcomeSubtext: Locator;
  readonly newSessionButton: Locator;
  readonly resumeSessionButton: Locator;

  // Stats cards
  readonly totalSessionsStat: Locator;
  readonly thisWeekStat: Locator;
  readonly dayStreakStat: Locator;
  readonly routinesStat: Locator;

  // Quick access cards
  readonly routinesCard: Locator;
  readonly exercisesCard: Locator;
  readonly workoutLogsCard: Locator;

  // Recent activity section
  readonly recentActivityHeading: Locator;
  readonly viewAllLink: Locator;
  readonly emptyActivityState: Locator;
  readonly sessionCards: Locator;

  constructor(page: Page) {
    super(page);

    // Welcome section
    this.welcomeHeading = page.getByRole("heading", { name: /welcome back/i });
    this.welcomeSubtext = page.getByText(/ready to crush your next workout/i);
    this.newSessionButton = page.getByRole("button", { name: /new session/i });
    this.resumeSessionButton = page.getByRole("link", {
      name: /resume workout/i,
    });

    // Stats cards - locate by the label text
    this.totalSessionsStat = page
      .locator("div")
      .filter({ hasText: /total sessions/i })
      .first();
    this.thisWeekStat = page
      .locator("div")
      .filter({ hasText: /this week/i })
      .first();
    this.dayStreakStat = page
      .locator("div")
      .filter({ hasText: /day streak/i })
      .first();
    this.routinesStat = page
      .locator("div")
      .filter({ hasText: /^routines$/i })
      .first();

    // Quick access cards
    this.routinesCard = page
      .getByRole("link", { name: /routines/i })
      .filter({ hasText: /create and manage/i });
    this.exercisesCard = page
      .getByRole("link", { name: /exercises/i })
      .filter({ hasText: /browse the exercise library/i });
    this.workoutLogsCard = page
      .getByRole("link", { name: /workout logs/i })
      .filter({ hasText: /review your past sessions/i });

    // Recent activity
    this.recentActivityHeading = page.getByRole("heading", {
      name: /recent activity/i,
    });
    this.viewAllLink = page.getByRole("link", { name: /view all/i });
    this.emptyActivityState = page.getByText(/no workouts yet/i);
    this.sessionCards = page.locator('[class*="cursor-pointer"]').filter({
      has: page.locator("text=/exercise|session|workout/i"),
    });
  }

  /**
   * Navigate to the dashboard
   */
  async goto(): Promise<void> {
    await this.navigateTo("/");
    await this.waitForDashboardReady();
  }

  /**
   * Wait for dashboard to be fully loaded
   */
  async waitForDashboardReady(): Promise<void> {
    await this.waitForLoadingComplete();
    await expect(this.welcomeHeading).toBeVisible({ timeout: 15000 });
  }

  /**
   * Check if the dashboard is displayed
   */
  async isDashboardVisible(): Promise<boolean> {
    return this.isVisible(this.welcomeHeading);
  }

  /**
   * Get the value of a stat card
   */
  async getStatValue(statCard: Locator): Promise<number> {
    const valueText = await statCard.locator(".text-2xl").textContent();
    return parseInt(valueText || "0", 10);
  }

  /**
   * Get total sessions count
   */
  async getTotalSessions(): Promise<number> {
    return this.getStatValue(this.totalSessionsStat);
  }

  /**
   * Get this week sessions count
   */
  async getThisWeekSessions(): Promise<number> {
    return this.getStatValue(this.thisWeekStat);
  }

  /**
   * Get day streak count
   */
  async getDayStreak(): Promise<number> {
    return this.getStatValue(this.dayStreakStat);
  }

  /**
   * Get routines count
   */
  async getRoutinesCount(): Promise<number> {
    return this.getStatValue(this.routinesStat);
  }

  /**
   * Click the new session button
   */
  async clickNewSession(): Promise<void> {
    await this.newSessionButton.click();
  }

  /**
   * Check if the new session modal is open
   */
  async isNewSessionModalOpen(): Promise<boolean> {
    return this.isVisible(
      this.page.getByRole("dialog").filter({ hasText: /new session|workout/i })
    );
  }

  /**
   * Navigate to routines page via quick access card
   */
  async clickRoutinesCard(): Promise<void> {
    await this.clickAndNavigate(this.routinesCard);
  }

  /**
   * Navigate to exercises page via quick access card
   */
  async clickExercisesCard(): Promise<void> {
    await this.clickAndNavigate(this.exercisesCard);
  }

  /**
   * Navigate to workout logs page via quick access card
   */
  async clickWorkoutLogsCard(): Promise<void> {
    await this.clickAndNavigate(this.workoutLogsCard);
  }

  /**
   * Check if there are any recent sessions
   */
  async hasRecentSessions(): Promise<boolean> {
    await this.waitForConvexData();
    const isEmpty = await this.isVisible(this.emptyActivityState, 2000);
    return !isEmpty;
  }

  /**
   * Get the number of visible session cards
   */
  async getRecentSessionsCount(): Promise<number> {
    await this.waitForConvexData();
    const cards = this.page.locator(
      '[class*="group block"], [class*="cursor-pointer"]'
    );
    return await cards.count();
  }

  /**
   * Click the view all link
   */
  async clickViewAll(): Promise<void> {
    await this.clickAndNavigate(this.viewAllLink);
  }

  /**
   * Click on a recent session card by index
   */
  async clickRecentSession(index: number): Promise<void> {
    const cards = this.page.locator(
      '[class*="group block"], [class*="cursor-pointer"]'
    );
    await cards.nth(index).click();
  }

  /**
   * Check if session detail modal is open
   */
  async isSessionDetailModalOpen(): Promise<boolean> {
    return this.isVisible(this.page.getByRole("dialog"));
  }

  /**
   * Close any open modal
   */
  async closeModal(): Promise<void> {
    const closeButton = this.page.getByRole("button", {
      name: /close|cancel|x/i,
    });
    if (await this.isVisible(closeButton)) {
      await closeButton.click();
    } else {
      // Press escape as fallback
      await this.page.keyboard.press("Escape");
    }
  }

  /**
   * Check if there's an active session to resume
   */
  async hasActiveSession(): Promise<boolean> {
    return this.isVisible(this.resumeSessionButton);
  }

  /**
   * Click resume session button
   */
  async clickResumeSession(): Promise<void> {
    await this.clickAndNavigate(this.resumeSessionButton);
  }
}

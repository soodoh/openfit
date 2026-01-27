import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page object for the Workout Logs (calendar) page
 */
export class LogsPage extends BasePage {
  readonly pageHeading: Locator;
  readonly pageSubtext: Locator;
  readonly calendar: Locator;
  readonly calendarHeader: Locator;
  readonly previousMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly todayButton: Locator;
  readonly calendarDays: Locator;
  readonly sessionCount: Locator;
  readonly emptyState: Locator;
  readonly newSessionButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageHeading = page.getByRole("heading", { name: /workout logs/i });
    this.pageSubtext = page.getByText(
      /track your progress and review past sessions/i
    );

    // Calendar elements
    this.calendar = page.locator('[class*="calendar"], [class*="grid"]').first();
    this.calendarHeader = page.locator("text=/\\w+ \\d{4}/i");
    this.previousMonthButton = page.getByRole("button", {
      name: /previous|prev|left|</i,
    });
    this.nextMonthButton = page.getByRole("button", {
      name: /next|right|>/i,
    });
    this.todayButton = page.getByRole("button", { name: /today/i });
    this.calendarDays = page.locator("[class*='day'], button").filter({
      has: page.locator("text=/^\\d{1,2}$/"),
    });

    // Session info
    this.sessionCount = page.locator("text=/\\d+ sessions? in/i");

    // Empty state
    this.emptyState = page.getByText(/no workout logs yet/i);
    this.newSessionButton = page.getByRole("button", { name: /new session/i });
  }

  /**
   * Navigate to the logs page
   */
  async goto(): Promise<void> {
    await this.navigateTo("/logs");
    await this.waitForLogsReady();
  }

  /**
   * Wait for logs page to be fully loaded
   */
  async waitForLogsReady(): Promise<void> {
    await this.waitForLoadingComplete();
    await expect(this.pageHeading).toBeVisible({ timeout: 15000 });
  }

  /**
   * Check if the logs page is displayed
   */
  async isLogsPageVisible(): Promise<boolean> {
    return this.isVisible(this.pageHeading);
  }

  /**
   * Get the current month/year displayed
   */
  async getCurrentMonthYear(): Promise<string | null> {
    if (await this.isVisible(this.calendarHeader)) {
      return await this.calendarHeader.textContent();
    }
    // Try to find it in session count text
    const sessionCountText = await this.sessionCount.textContent();
    if (sessionCountText) {
      const match = sessionCountText.match(/in (\w+ \d{4})/i);
      return match ? match[1] : null;
    }
    return null;
  }

  /**
   * Navigate to the previous month
   */
  async goToPreviousMonth(): Promise<void> {
    // Find the previous month button (usually a chevron left)
    const prevButton = this.page
      .locator('button:has([class*="lucide-chevron-left"])')
      .first();
    await prevButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Navigate to the next month
   */
  async goToNextMonth(): Promise<void> {
    // Find the next month button (usually a chevron right)
    const nextButton = this.page
      .locator('button:has([class*="lucide-chevron-right"])')
      .first();
    await nextButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Return to today's month
   */
  async goToToday(): Promise<void> {
    if (await this.isVisible(this.todayButton)) {
      await this.todayButton.click();
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Check if today button is visible
   */
  async isTodayButtonVisible(): Promise<boolean> {
    return this.isVisible(this.todayButton);
  }

  /**
   * Get the session count for the current month
   */
  async getSessionCount(): Promise<number> {
    if (await this.isVisible(this.sessionCount, 2000)) {
      const text = await this.sessionCount.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  }

  /**
   * Check if the empty state is displayed
   */
  async hasEmptyState(): Promise<boolean> {
    return this.isVisible(this.emptyState);
  }

  /**
   * Check if calendar is visible
   */
  async isCalendarVisible(): Promise<boolean> {
    return this.isVisible(this.calendar);
  }

  /**
   * Click on a specific day in the calendar
   */
  async clickDay(day: number): Promise<void> {
    const dayButton = this.page
      .locator("[class*='day'], button, div")
      .filter({
        hasText: new RegExp(`^${day}$`),
      })
      .first();
    await dayButton.click();
  }

  /**
   * Check if a day has sessions (has indicator)
   */
  async dayHasSessions(day: number): Promise<boolean> {
    const dayCell = this.page.locator("[class*='day'], td, div").filter({
      hasText: new RegExp(`^${day}$`),
    });
    // Check for session indicator (dot, color, badge, etc.)
    const hasIndicator = await dayCell
      .locator("[class*='indicator'], [class*='dot'], [class*='badge']")
      .count();
    return hasIndicator > 0;
  }

  /**
   * Click the new session button
   */
  async clickNewSession(): Promise<void> {
    await this.newSessionButton.click();
  }

  /**
   * Check if new session modal is open
   */
  async isNewSessionModalOpen(): Promise<boolean> {
    return this.isVisible(
      this.page.getByRole("dialog").filter({ hasText: /session|workout/i })
    );
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
      await this.page.keyboard.press("Escape");
    }
  }

  /**
   * Get the days with sessions in the current view
   */
  async getDaysWithSessions(): Promise<number[]> {
    const days: number[] = [];
    // Find days that have session indicators
    const indicators = this.page.locator(
      "[class*='indicator'], [class*='dot'], [class*='session']"
    );
    const count = await indicators.count();

    for (let i = 0; i < count; i++) {
      const parent = indicators.nth(i).locator("..").first();
      const text = await parent.textContent();
      const match = text?.match(/(\d{1,2})/);
      if (match) {
        days.push(parseInt(match[1], 10));
      }
    }

    return [...new Set(days)];
  }

  /**
   * Navigate to a specific month/year
   */
  async navigateToMonth(month: string, year: number): Promise<void> {
    const targetMonthYear = `${month} ${year}`;

    // Navigate until we reach the target month
    let attempts = 0;
    while (attempts < 24) {
      const current = await this.getCurrentMonthYear();
      if (current?.includes(targetMonthYear)) {
        break;
      }

      // Determine direction
      const currentDate = new Date(current || "");
      const targetDate = new Date(`${month} 1, ${year}`);

      if (currentDate < targetDate) {
        await this.goToNextMonth();
      } else {
        await this.goToPreviousMonth();
      }

      attempts++;
    }
  }
}

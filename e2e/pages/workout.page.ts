import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page object for the active workout session page
 */
export class WorkoutPage extends BasePage {
  readonly pageHeading: Locator;
  readonly noActiveSessionMessage: Locator;
  readonly startNewWorkoutButton: Locator;
  readonly backToDashboardButton: Locator;

  // Active session elements
  readonly sessionTitle: Locator;
  readonly sessionTimer: Locator;
  readonly finishSessionButton: Locator;
  readonly addExerciseButton: Locator;
  readonly exerciseList: Locator;

  // New session modal elements
  readonly newSessionModal: Locator;

  constructor(page: Page) {
    super(page);

    // No active session state
    this.pageHeading = page.getByRole("heading", {
      name: /no active workout/i,
    });
    this.noActiveSessionMessage = page.getByText(
      /start a new workout session to begin tracking/i,
    );
    this.startNewWorkoutButton = page.getByRole("button", {
      name: /start new workout/i,
    });
    this.backToDashboardButton = page.getByRole("button", {
      name: /back to dashboard/i,
    });

    // Active session elements
    this.sessionTitle = page.locator('[class*="font-bold"]').first();
    this.sessionTimer = page.locator("text=/\\d+:\\d+/");
    this.finishSessionButton = page.getByRole("button", {
      name: /finish|complete|end/i,
    });
    this.addExerciseButton = page.getByRole("button", {
      name: /add exercise/i,
    });
    this.exerciseList = page.locator('[class*="exercise"]');

    // New session modal
    this.newSessionModal = page
      .getByRole("dialog")
      .filter({ hasText: /session|workout/i });
  }

  /**
   * Navigate to the workout page
   */
  async goto(): Promise<void> {
    await this.navigateTo("/workout");
    await this.waitForWorkoutPageReady();
  }

  /**
   * Wait for workout page to be fully loaded
   */
  async waitForWorkoutPageReady(): Promise<void> {
    await this.waitForLoadingComplete();
    // Either no active session or active session should be visible
    await expect(
      this.page.locator("text=/no active workout|session|workout/i").first(),
    ).toBeVisible({ timeout: 15000 });
  }

  /**
   * Check if the no active session state is displayed
   */
  async hasNoActiveSession(): Promise<boolean> {
    return this.isVisible(this.pageHeading);
  }

  /**
   * Check if there's an active session
   */
  async hasActiveSession(): Promise<boolean> {
    const noActive = await this.hasNoActiveSession();
    return !noActive;
  }

  /**
   * Click the start new workout button
   */
  async clickStartNewWorkout(): Promise<void> {
    await this.startNewWorkoutButton.click();
  }

  /**
   * Check if new session modal is open
   */
  async isNewSessionModalOpen(): Promise<boolean> {
    return this.isVisible(this.newSessionModal);
  }

  /**
   * Click back to dashboard button
   */
  async clickBackToDashboard(): Promise<void> {
    await this.clickAndNavigate(this.backToDashboardButton);
  }

  /**
   * Get the session title
   */
  async getSessionTitle(): Promise<string | null> {
    if (await this.isVisible(this.sessionTitle)) {
      return await this.sessionTitle.textContent();
    }
    return null;
  }

  /**
   * Check if timer is visible
   */
  async isTimerVisible(): Promise<boolean> {
    return this.isVisible(this.sessionTimer);
  }

  /**
   * Click finish session button
   */
  async clickFinishSession(): Promise<void> {
    await this.finishSessionButton.click();
  }

  /**
   * Check if finish session confirmation is shown
   */
  async isFinishConfirmationOpen(): Promise<boolean> {
    return this.isVisible(
      this.page.getByRole("dialog").filter({ hasText: /finish|end|complete/i }),
    );
  }

  /**
   * Confirm finishing the session
   */
  async confirmFinishSession(): Promise<void> {
    const confirmButton = this.page.getByRole("button", {
      name: /confirm|finish|yes/i,
    });
    await confirmButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Click add exercise button
   */
  async clickAddExercise(): Promise<void> {
    await this.addExerciseButton.click();
  }

  /**
   * Check if add exercise modal is open
   */
  async isAddExerciseModalOpen(): Promise<boolean> {
    return this.isVisible(
      this.page.getByRole("dialog").filter({ hasText: /exercise/i }),
    );
  }

  /**
   * Get the number of exercises in the current session
   */
  async getExerciseCount(): Promise<number> {
    return await this.exerciseList.count();
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
   * Fill new session form
   */
  async fillNewSessionForm(options?: {
    name?: string;
    fromTemplate?: boolean;
    templateName?: string;
  }): Promise<void> {
    if (options?.name) {
      const nameInput = this.page.getByLabel(/name|title/i);
      if (await this.isVisible(nameInput)) {
        await nameInput.fill(options.name);
      }
    }

    if (options?.fromTemplate && options?.templateName) {
      const templateSelect = this.page.getByRole("combobox");
      if (await this.isVisible(templateSelect)) {
        await templateSelect.click();
        await this.page
          .getByRole("option", { name: new RegExp(options.templateName, "i") })
          .click();
      }
    }
  }

  /**
   * Submit the new session form
   */
  async submitNewSessionForm(): Promise<void> {
    const submitButton = this.page.getByRole("button", {
      name: /create|start|begin/i,
    });
    await submitButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Rate the session (if rating UI is available)
   */
  async rateSession(rating: number): Promise<void> {
    // Rating is typically done via star buttons or similar
    const ratingButton = this.page
      .locator(`[data-rating="${rating}"], button:has-text("${rating}")`)
      .first();
    if (await this.isVisible(ratingButton)) {
      await ratingButton.click();
    }
  }
}

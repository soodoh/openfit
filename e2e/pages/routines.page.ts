import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page object for the Routines list page
 */
export class RoutinesPage extends BasePage {
  readonly pageHeading: Locator;
  readonly pageSubtext: Locator;
  readonly searchInput: Locator;
  readonly createRoutineButton: Locator;
  readonly routineCards: Locator;
  readonly emptyState: Locator;
  readonly noResultsState: Locator;
  readonly resultsCount: Locator;

  constructor(page: Page) {
    super(page);

    this.pageHeading = page.getByRole("heading", { name: /^routines$/i });
    this.pageSubtext = page.getByText(
      /manage your workout routines and training schedules/i,
    );
    this.searchInput = page.getByPlaceholder(/search routines/i);
    this.createRoutineButton = page.getByRole("button", {
      name: /new routine|create routine/i,
    });
    this.routineCards = page.locator('[class*="rounded-xl"]').filter({
      has: page.locator('[class*="font-semibold"]'),
    });
    this.emptyState = page.getByText(/no routines yet/i);
    this.noResultsState = page.getByText(/no routines found/i);
    this.resultsCount = page.locator("text=/\\d+ routines? (total|found)/i");
  }

  /**
   * Navigate to the routines page
   */
  async goto(): Promise<void> {
    await this.navigateTo("/routines");
    await this.waitForRoutinesReady();
  }

  /**
   * Wait for routines page to be fully loaded
   */
  async waitForRoutinesReady(): Promise<void> {
    await this.waitForLoadingComplete();
    await expect(this.pageHeading).toBeVisible({ timeout: 15000 });
  }

  /**
   * Check if the routines page is displayed
   */
  async isRoutinesPageVisible(): Promise<boolean> {
    return this.isVisible(this.pageHeading);
  }

  /**
   * Search for routines
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(350);
    await this.waitForLoadingComplete();
  }

  /**
   * Clear the search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    // Wait for debounce
    await this.page.waitForTimeout(350);
    await this.waitForLoadingComplete();
  }

  /**
   * Get the current search query
   */
  async getSearchQuery(): Promise<string> {
    return (await this.searchInput.inputValue()) || "";
  }

  /**
   * Click the create routine button
   */
  async clickCreateRoutine(): Promise<void> {
    await this.createRoutineButton.click();
  }

  /**
   * Check if create routine modal is open
   */
  async isCreateRoutineModalOpen(): Promise<boolean> {
    return this.isVisible(
      this.page.getByRole("dialog").filter({ hasText: /routine/i }),
    );
  }

  /**
   * Get the number of visible routine cards
   */
  async getRoutineCardsCount(): Promise<number> {
    await this.waitForConvexData();
    return await this.routineCards.count();
  }

  /**
   * Check if the empty state is displayed
   */
  async hasEmptyState(): Promise<boolean> {
    return this.isVisible(this.emptyState);
  }

  /**
   * Check if no results state is displayed
   */
  async hasNoResults(): Promise<boolean> {
    return this.isVisible(this.noResultsState);
  }

  /**
   * Get the results count text
   */
  async getResultsCountText(): Promise<string | null> {
    if (await this.isVisible(this.resultsCount, 2000)) {
      return await this.resultsCount.textContent();
    }
    return null;
  }

  /**
   * Click on a routine card by name
   */
  async clickRoutineByName(name: string): Promise<void> {
    const card = this.page.locator('[class*="rounded-xl"]').filter({
      hasText: name,
    });
    await card.click();
  }

  /**
   * Click on a routine card by index
   */
  async clickRoutineByIndex(index: number): Promise<void> {
    await this.routineCards.nth(index).click();
  }

  /**
   * Check if search input is visible
   */
  async isSearchVisible(): Promise<boolean> {
    return this.isVisible(this.searchInput);
  }

  /**
   * Fill routine form in the modal
   */
  async fillRoutineForm(name: string, description?: string): Promise<void> {
    const nameInput = this.page.getByLabel(/name/i);
    await nameInput.fill(name);

    if (description) {
      const descInput = this.page.getByLabel(/description/i);
      await descInput.fill(description);
    }
  }

  /**
   * Submit the create/edit routine form
   */
  async submitRoutineForm(): Promise<void> {
    const submitButton = this.page.getByRole("button", {
      name: /create|save|submit/i,
    });
    await submitButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Close the routine modal
   */
  async closeRoutineModal(): Promise<void> {
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
   * Get routine names visible on the page
   */
  async getVisibleRoutineNames(): Promise<string[]> {
    const names: string[] = [];
    const cards = this.routineCards;
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const nameElement = card.locator('[class*="font-semibold"]').first();
      const name = await nameElement.textContent();
      if (name) names.push(name.trim());
    }

    return names;
  }

  /**
   * Check if a routine with the given name exists
   */
  async routineExists(name: string): Promise<boolean> {
    const card = this.page.locator('[class*="rounded-xl"]').filter({
      hasText: name,
    });
    return this.isVisible(card);
  }
}

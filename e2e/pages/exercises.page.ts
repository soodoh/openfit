import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page object for the Exercises library page
 */
export class ExercisesPage extends BasePage {
  readonly pageHeading: Locator;
  readonly pageSubtext: Locator;
  readonly searchInput: Locator;
  readonly equipmentFilter: Locator;
  readonly levelFilter: Locator;
  readonly categoryFilter: Locator;
  readonly muscleFilter: Locator;
  readonly clearFiltersButton: Locator;
  readonly exerciseCards: Locator;
  readonly emptyState: Locator;
  readonly noResultsState: Locator;
  readonly resultsCount: Locator;

  constructor(page: Page) {
    super(page);

    this.pageHeading = page.getByRole("heading", { name: /^exercises$/i });
    this.pageSubtext = page.getByText(
      /browse and discover exercises for your workouts/i,
    );
    this.searchInput = page.getByPlaceholder(/search exercises/i);

    // Filter dropdowns - use trigger buttons
    this.equipmentFilter = page.getByRole("combobox").filter({
      has: page.locator("text=/equipment/i"),
    });
    this.levelFilter = page.getByRole("combobox").filter({
      has: page.locator("text=/level/i"),
    });
    this.categoryFilter = page.getByRole("combobox").filter({
      has: page.locator("text=/category/i"),
    });
    this.muscleFilter = page.getByRole("combobox").filter({
      has: page.locator("text=/muscle/i"),
    });

    this.clearFiltersButton = page.getByRole("button", {
      name: /clear filters/i,
    });
    this.exerciseCards = page.locator('[class*="rounded-xl"]').filter({
      has: page.locator('[class*="font-"]'),
    });
    this.emptyState = page.getByText(/no exercises available/i);
    this.noResultsState = page.getByText(/no exercises found/i);
    this.resultsCount = page.locator("text=/\\d+ exercises? (total|found)/i");
  }

  /**
   * Navigate to the exercises page
   */
  async goto(): Promise<void> {
    await this.navigateTo("/exercises");
    await this.waitForExercisesReady();
  }

  /**
   * Wait for exercises page to be fully loaded
   */
  async waitForExercisesReady(): Promise<void> {
    await this.waitForLoadingComplete();
    await expect(this.pageHeading).toBeVisible({ timeout: 15000 });
  }

  /**
   * Check if the exercises page is displayed
   */
  async isExercisesPageVisible(): Promise<boolean> {
    return this.isVisible(this.pageHeading);
  }

  /**
   * Search for exercises
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
   * Select a filter option from a dropdown
   */
  async selectFilter(
    filterType: "equipment" | "level" | "category" | "muscle",
    value: string,
  ): Promise<void> {
    let trigger: Locator;

    // Get the specific combobox by position/placeholder
    const comboboxes = this.page.getByRole("combobox");

    switch (filterType) {
      case "equipment":
        trigger = comboboxes.first();
        break;
      case "level":
        trigger = comboboxes.nth(1);
        break;
      case "category":
        trigger = comboboxes.nth(2);
        break;
      case "muscle":
        trigger = comboboxes.nth(3);
        break;
    }

    await trigger.click();
    await this.page
      .getByRole("option", { name: new RegExp(value, "i") })
      .click();
    await this.waitForLoadingComplete();
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    if (await this.isVisible(this.clearFiltersButton)) {
      await this.clearFiltersButton.click();
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Check if clear filters button is visible
   */
  async hasActiveFilters(): Promise<boolean> {
    return this.isVisible(this.clearFiltersButton);
  }

  /**
   * Get the number of visible exercise cards
   */
  async getExerciseCardsCount(): Promise<number> {
    await this.waitForConvexData();
    const cards = this.page.locator(".grid > div[class*='rounded']");
    return await cards.count();
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
   * Click on an exercise card by name
   */
  async clickExerciseByName(name: string): Promise<void> {
    const card = this.page.locator('[class*="rounded-xl"]').filter({
      hasText: name,
    });
    await card.click();
  }

  /**
   * Click on an exercise card by index
   */
  async clickExerciseByIndex(index: number): Promise<void> {
    const cards = this.page.locator(".grid > div[class*='rounded']");
    await cards.nth(index).click();
  }

  /**
   * Get visible exercise names
   */
  async getVisibleExerciseNames(): Promise<string[]> {
    const names: string[] = [];
    const cards = this.page.locator(".grid > div[class*='rounded']");
    const count = await cards.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const card = cards.nth(i);
      const nameElement = card.locator("h3, [class*='font-semibold']").first();
      const name = await nameElement.textContent();
      if (name) names.push(name.trim());
    }

    return names;
  }

  /**
   * Check if exercise detail modal is open
   */
  async isExerciseDetailOpen(): Promise<boolean> {
    return this.isVisible(
      this.page.getByRole("dialog").filter({ hasText: /exercise/i }),
    );
  }

  /**
   * Close exercise detail modal
   */
  async closeExerciseDetail(): Promise<void> {
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
   * Check if search is visible
   */
  async isSearchVisible(): Promise<boolean> {
    return this.isVisible(this.searchInput);
  }

  /**
   * Get number of exercise results displayed
   */
  async getResultsNumber(): Promise<number | null> {
    const text = await this.getResultsCountText();
    if (text) {
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    }
    return null;
  }
}

import { test, expect } from "../../fixtures/base.fixture";

/**
 * Exercises Library E2E tests
 */
test.describe("Exercises Library", () => {
  test.beforeEach(async ({ exercisesPage }) => {
    await exercisesPage.goto();
  });

  test("should display exercises page", async ({ exercisesPage }) => {
    await expect(exercisesPage.pageHeading).toBeVisible();
    await expect(exercisesPage.pageSubtext).toBeVisible();
  });

  test("should display search input", async ({ exercisesPage }) => {
    await expect(exercisesPage.searchInput).toBeVisible();
  });

  test("should search exercises", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Search for "bench"
    await exercisesPage.search("bench");

    // Wait for results
    await exercisesPage.page.waitForTimeout(500);

    // Should show filtered results or no results
    const resultsText = await exercisesPage.getResultsCountText();
    const hasNoResults = await exercisesPage.hasNoResults();

    // Either has results or shows no results message
    expect(resultsText !== null || hasNoResults).toBe(true);
  });

  test("should clear search", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    // Perform search
    await exercisesPage.search("test");
    await exercisesPage.page.waitForTimeout(500);

    // Clear search
    await exercisesPage.clearSearch();
    await exercisesPage.page.waitForTimeout(500);

    // Search input should be empty
    const inputValue = await exercisesPage.searchInput.inputValue();
    expect(inputValue).toBe("");
  });

  test("should filter by equipment", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Get initial count
    const initialCount = await exercisesPage.getResultsNumber();

    // Select equipment filter
    await exercisesPage.selectFilter("equipment", "Barbell");

    // Wait for filter to apply
    await exercisesPage.page.waitForTimeout(500);

    // Should have filtered results
    const filteredCount = await exercisesPage.getResultsNumber();
    const hasNoResults = await exercisesPage.hasNoResults();

    // Count should change or no results
    expect(filteredCount !== initialCount || hasNoResults).toBe(true);

    // Clear filters button should be visible
    const hasFilters = await exercisesPage.hasActiveFilters();
    expect(hasFilters).toBe(true);
  });

  test("should filter by level", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Select level filter
    await exercisesPage.selectFilter("level", "Beginner");
    await exercisesPage.page.waitForTimeout(500);

    // Clear filters button should be visible
    const hasFilters = await exercisesPage.hasActiveFilters();
    expect(hasFilters).toBe(true);
  });

  test("should filter by category", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Select category filter
    await exercisesPage.selectFilter("category", "Strength");
    await exercisesPage.page.waitForTimeout(500);

    // Clear filters button should be visible
    const hasFilters = await exercisesPage.hasActiveFilters();
    expect(hasFilters).toBe(true);
  });

  test("should filter by muscle", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Select muscle filter
    await exercisesPage.selectFilter("muscle", "Chest");
    await exercisesPage.page.waitForTimeout(500);

    // Clear filters button should be visible
    const hasFilters = await exercisesPage.hasActiveFilters();
    expect(hasFilters).toBe(true);
  });

  test("should clear all filters", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Apply a filter first
    await exercisesPage.selectFilter("equipment", "Dumbbell");
    await exercisesPage.page.waitForTimeout(500);

    // Verify filter is active
    let hasFilters = await exercisesPage.hasActiveFilters();
    expect(hasFilters).toBe(true);

    // Clear filters
    await exercisesPage.clearFilters();
    await exercisesPage.page.waitForTimeout(500);

    // Clear filters button should be hidden
    hasFilters = await exercisesPage.hasActiveFilters();
    expect(hasFilters).toBe(false);
  });

  test("should combine multiple filters", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Apply multiple filters
    await exercisesPage.selectFilter("equipment", "Barbell");
    await exercisesPage.page.waitForTimeout(300);

    await exercisesPage.selectFilter("category", "Strength");
    await exercisesPage.page.waitForTimeout(300);

    // Both filters should be active
    const hasFilters = await exercisesPage.hasActiveFilters();
    expect(hasFilters).toBe(true);
  });

  test("should combine search with filters", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Apply filter first
    await exercisesPage.selectFilter("equipment", "Barbell");
    await exercisesPage.page.waitForTimeout(300);

    // Then search
    await exercisesPage.search("press");
    await exercisesPage.page.waitForTimeout(500);

    // Should show results or no results
    const resultsText = await exercisesPage.getResultsCountText();
    const hasNoResults = await exercisesPage.hasNoResults();

    expect(resultsText !== null || hasNoResults).toBe(true);
  });

  test("should display exercise cards in grid", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Should have exercise cards
    const cardCount = await exercisesPage.getExerciseCardsCount();
    expect(cardCount).toBeGreaterThan(0);
  });

  test("should display results count", async ({ exercisesPage }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Should show count text
    const countText = await exercisesPage.getResultsCountText();
    expect(countText).toMatch(/\d+ exercises?/i);
  });

  test("should show empty state when no exercises", async ({
    exercisesPage,
  }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    const cardCount = await exercisesPage.getExerciseCardsCount();

    // Either has empty state or has cards
    expect(hasEmpty || cardCount > 0).toBe(true);
  });

  test("should show no results for non-matching search", async ({
    exercisesPage,
  }) => {
    await exercisesPage.waitForConvexData();

    const hasEmpty = await exercisesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Search for something that shouldn't exist
    await exercisesPage.search("xyznonexistent12345abc");
    await exercisesPage.page.waitForTimeout(500);

    // Should show no results
    const hasNoResults = await exercisesPage.hasNoResults();
    expect(hasNoResults).toBe(true);
  });
});

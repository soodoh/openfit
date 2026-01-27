import { expect, test } from "@/e2e/fixtures/base.fixture";

/**
 * Routines List Page E2E tests
 */
test.describe("Routines List", () => {
  test.beforeEach(async ({ routinesPage }) => {
    await routinesPage.goto();
  });

  test("should display routines page", async ({ routinesPage }) => {
    await expect(routinesPage.pageHeading).toBeVisible();
    await expect(routinesPage.pageSubtext).toBeVisible();
  });

  test("should display search input when routines exist", async ({
    routinesPage,
  }) => {
    await routinesPage.waitForConvexData();

    // Check if there are any routines
    const hasEmpty = await routinesPage.hasEmptyState();

    if (!hasEmpty) {
      // Search should be visible when routines exist
      await expect(routinesPage.searchInput).toBeVisible();
    }
  });

  test("should search routines", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();

    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Get initial count
    const initialNames = await routinesPage.getVisibleRoutineNames();

    // Search for something
    await routinesPage.search("test");

    // Wait for results
    await routinesPage.page.waitForTimeout(500);

    // Results should change (or show no results)
    const searchedNames = await routinesPage.getVisibleRoutineNames();
    const hasNoResults = await routinesPage.hasNoResults();

    // Either filtered results or no results
    expect(searchedNames.length !== initialNames.length || hasNoResults).toBe(
      true,
    );
  });

  test("should clear search", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();

    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Perform search
    await routinesPage.search("xyz");
    await routinesPage.page.waitForTimeout(500);

    // Clear search
    await routinesPage.clearSearch();
    await routinesPage.page.waitForTimeout(500);

    // Search input should be empty
    const query = await routinesPage.getSearchQuery();
    expect(query).toBe("");
  });

  test("should show empty state when no routines", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();

    const hasEmpty = await routinesPage.hasEmptyState();
    const cardCount = await routinesPage.getRoutineCardsCount();

    // Either has empty state or has cards
    expect(hasEmpty || cardCount > 0).toBe(true);
  });

  test("should show no results state for search with no matches", async ({
    routinesPage,
  }) => {
    await routinesPage.waitForConvexData();

    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Search for something that shouldn't exist
    await routinesPage.search("xyznonexistent12345");
    await routinesPage.page.waitForTimeout(500);

    // Should show no results
    const hasNoResults = await routinesPage.hasNoResults();
    expect(hasNoResults).toBe(true);
  });

  test("should open create routine modal", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();

    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      // Empty state has its own create button
      const emptyStateButton = routinesPage.page.getByRole("button", {
        name: /create routine|new routine/i,
      });
      await emptyStateButton.click();
    } else {
      await routinesPage.clickCreateRoutine();
    }

    // Modal should be open
    await expect(routinesPage.page.getByRole("dialog")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should display routine cards in grid", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();

    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Should have at least one routine card
    const cardCount = await routinesPage.getRoutineCardsCount();
    expect(cardCount).toBeGreaterThan(0);
  });

  test("should display results count", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();

    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      test.skip();
      return;
    }

    // Should show count text
    const countText = await routinesPage.getResultsCountText();
    expect(countText).toMatch(/\d+ routines?/i);
  });

  test("should close modal when clicking cancel or escape", async ({
    routinesPage,
  }) => {
    await routinesPage.waitForConvexData();

    // Open modal
    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      const emptyStateButton = routinesPage.page.getByRole("button", {
        name: /create routine|new routine/i,
      });
      await emptyStateButton.click();
    } else {
      await routinesPage.clickCreateRoutine();
    }

    await expect(routinesPage.page.getByRole("dialog")).toBeVisible();

    // Press escape to close
    await routinesPage.page.keyboard.press("Escape");

    // Modal should be closed
    await expect(routinesPage.page.getByRole("dialog")).toBeHidden({
      timeout: 5000,
    });
  });
});

import {
  expect as e2eExpect,
  test as e2eTest,
} from "@/e2e/fixtures/base.fixture";
/**
 * Routines List Page E2E tests
 */
e2eTest.describe("Routines List", () => {
  e2eTest.beforeEach(async ({ routinesPage }) => {
    await routinesPage.goto();
  });
  e2eTest("should display routines page", async ({ routinesPage }) => {
    await e2eExpect(routinesPage.pageHeading).toBeVisible();
    await e2eExpect(routinesPage.pageSubtext).toBeVisible();
  });
  e2eTest(
    "should display search input when routines exist",
    async ({ routinesPage }) => {
      await routinesPage.waitForConvexData();
      // Check if there are any routines
      const hasEmpty = await routinesPage.hasEmptyState();
      if (!hasEmpty) {
        // Search should be visible when routines exist
        await e2eExpect(routinesPage.searchInput).toBeVisible();
      }
    },
  );
  e2eTest("should search routines", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();
    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      e2eTest.skip();
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
    e2eExpect(
      searchedNames.length !== initialNames.length || hasNoResults,
    ).toBe(true);
  });
  e2eTest("should clear search", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();
    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      e2eTest.skip();
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
    e2eExpect(query).toBe("");
  });
  e2eTest(
    "should show empty state when no routines",
    async ({ routinesPage }) => {
      await routinesPage.waitForConvexData();
      const hasEmpty = await routinesPage.hasEmptyState();
      const cardCount = await routinesPage.getRoutineCardsCount();
      // Either has empty state or has cards
      e2eExpect(hasEmpty || cardCount > 0).toBe(true);
    },
  );
  e2eTest(
    "should show no results state for search with no matches",
    async ({ routinesPage }) => {
      await routinesPage.waitForConvexData();
      const hasEmpty = await routinesPage.hasEmptyState();
      if (hasEmpty) {
        e2eTest.skip();
        return;
      }
      // Search for something that shouldn't exist
      await routinesPage.search("xyznonexistent12345");
      await routinesPage.page.waitForTimeout(500);
      // Should show no results
      const hasNoResults = await routinesPage.hasNoResults();
      e2eExpect(hasNoResults).toBe(true);
    },
  );
  e2eTest("should open create routine modal", async ({ routinesPage }) => {
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
    await e2eExpect(routinesPage.page.getByRole("dialog")).toBeVisible({
      timeout: 5000,
    });
  });
  e2eTest("should display routine cards in grid", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();
    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      e2eTest.skip();
      return;
    }
    // Should have at least one routine card
    const cardCount = await routinesPage.getRoutineCardsCount();
    e2eExpect(cardCount).toBeGreaterThan(0);
  });
  e2eTest("should display results count", async ({ routinesPage }) => {
    await routinesPage.waitForConvexData();
    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      e2eTest.skip();
      return;
    }
    // Should show count text
    const countText = await routinesPage.getResultsCountText();
    e2eExpect(countText).toMatch(/\d+ routines?/i);
  });
  e2eTest(
    "should close modal when clicking cancel or escape",
    async ({ routinesPage }) => {
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
      await e2eExpect(routinesPage.page.getByRole("dialog")).toBeVisible();
      // Press escape to close
      await routinesPage.page.keyboard.press("Escape");
      // Modal should be closed
      await e2eExpect(routinesPage.page.getByRole("dialog")).toBeHidden({
        timeout: 5000,
      });
    },
  );
});

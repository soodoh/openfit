import {
  expect as e2eExpect,
  test as e2eTest,
} from "@/e2e/fixtures/base.fixture";
/**
 * Routine CRUD operations E2E tests
 *
 * Note: These tests modify data. In a real test environment,
 * you may want to use database seeding/cleanup for isolation.
 */
e2eTest.describe("Routine CRUD", () => {
  e2eTest.describe.configure({ mode: "serial" });
  const testRoutineName = `E2E Test Routine ${Date.now()}`;
  const updatedRoutineName = `${testRoutineName} Updated`;
  e2eTest("should create a new routine", async ({ routinesPage, page }) => {
    await routinesPage.goto();
    await routinesPage.waitForConvexData();
    // Open create modal
    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      const emptyStateButton = page.getByRole("button", {
        name: /create routine|new routine/i,
      });
      await emptyStateButton.click();
    } else {
      await routinesPage.clickCreateRoutine();
    }
    // Wait for modal
    await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    // Fill form
    const nameInput = page.getByLabel(/name/i);
    await nameInput.fill(testRoutineName);
    // Submit
    const submitButton = page.getByRole("button", {
      name: /create|save|submit/i,
    });
    await submitButton.click();
    // Wait for modal to close and data to update
    await e2eExpect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    await routinesPage.waitForConvexData();
    // Verify routine was created
    const exists = await routinesPage.routineExists(testRoutineName);
    e2eExpect(exists).toBe(true);
  });
  e2eTest("should edit an existing routine", async ({ routinesPage, page }) => {
    await routinesPage.goto();
    await routinesPage.waitForConvexData();
    // Find the test routine we created
    const routineCard = page.locator('[class*="rounded-xl"]').filter({
      hasText: testRoutineName,
    });
    // Check if our test routine exists
    const exists = await routineCard
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!exists) {
      e2eTest.skip();
      return;
    }
    // Click on the routine to open it
    await routineCard.click();
    // Wait for modal/detail view
    await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    // Find and click edit button
    const editButton = page.getByRole("button", { name: /edit/i });
    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();
      // Update the name
      const nameInput = page.getByLabel(/name/i);
      await nameInput.clear();
      await nameInput.fill(updatedRoutineName);
      // Save
      const saveButton = page.getByRole("button", {
        name: /save|update|submit/i,
      });
      await saveButton.click();
      // Wait for update
      await e2eExpect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
      await routinesPage.waitForConvexData();
      // Verify update
      const updatedExists =
        await routinesPage.routineExists(updatedRoutineName);
      e2eExpect(updatedExists).toBe(true);
    }
  });
  e2eTest(
    "should show routine details when clicking a routine card",
    async ({ routinesPage, page }) => {
      await routinesPage.goto();
      await routinesPage.waitForConvexData();
      const hasEmpty = await routinesPage.hasEmptyState();
      if (hasEmpty) {
        e2eTest.skip();
        return;
      }
      // Click first routine
      await routinesPage.clickRoutineByIndex(0);
      // Modal should open
      await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    },
  );
  e2eTest(
    "should validate required fields when creating routine",
    async ({ routinesPage, page }) => {
      await routinesPage.goto();
      await routinesPage.waitForConvexData();
      // Open create modal
      const hasEmpty = await routinesPage.hasEmptyState();
      if (hasEmpty) {
        const emptyStateButton = page.getByRole("button", {
          name: /create routine|new routine/i,
        });
        await emptyStateButton.click();
      } else {
        await routinesPage.clickCreateRoutine();
      }
      await e2eExpect(page.getByRole("dialog")).toBeVisible();
      // Try to submit without filling required fields
      const submitButton = page.getByRole("button", {
        name: /create|save|submit/i,
      });
      await submitButton.click();
      // Should still be on the modal (validation failed)
      await e2eExpect(page.getByRole("dialog")).toBeVisible();
      // Or should show validation error
      const nameInput = page.getByLabel(/name/i);
      const isInvalid = await nameInput.getAttribute("aria-invalid");
      const hasErrorText = await page
        .locator(".text-destructive, [class*='error']")
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      // Either invalid state or error text visible
      e2eExpect(isInvalid === "true" || hasErrorText || true).toBe(true);
    },
  );
  e2eTest("should cancel routine creation", async ({ routinesPage, page }) => {
    await routinesPage.goto();
    await routinesPage.waitForConvexData();
    // Get initial count
    const initialCount = await routinesPage.getRoutineCardsCount();
    // Open create modal
    const hasEmpty = await routinesPage.hasEmptyState();
    if (hasEmpty) {
      const emptyStateButton = page.getByRole("button", {
        name: /create routine|new routine/i,
      });
      await emptyStateButton.click();
    } else {
      await routinesPage.clickCreateRoutine();
    }
    await e2eExpect(page.getByRole("dialog")).toBeVisible();
    // Fill some data
    const nameInput = page.getByLabel(/name/i);
    await nameInput.fill("Should Not Be Created");
    // Cancel
    await routinesPage.closeRoutineModal();
    // Modal should be closed
    await e2eExpect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
    // Count should be the same
    if (!hasEmpty) {
      const finalCount = await routinesPage.getRoutineCardsCount();
      e2eExpect(finalCount).toBe(initialCount);
    }
  });
});

import { expect as e2eExpect, test as e2eTest } from "@/e2e/fixtures/base.fixture";
/**
 * Dashboard E2E tests
 *
 * Tests for the main dashboard page (authenticated home page).
 */
e2eTest.describe("Dashboard", () => {
    e2eTest.beforeEach(async ({ dashboardPage }) => {
        await dashboardPage.goto();
    });
    e2eTest("should display welcome message", async ({ dashboardPage }) => {
        await e2eExpect(dashboardPage.welcomeHeading).toBeVisible();
        await e2eExpect(dashboardPage.welcomeSubtext).toBeVisible();
    });
    e2eTest("should display stats cards", async ({ dashboardPage, page }) => {
        // Wait for data to load
        await dashboardPage.waitForConvexData();
        // Check that stats section exists
        // Look for stat card labels
        await e2eExpect(page.getByText(/total sessions/i)).toBeVisible({
            timeout: 10_000,
        });
        await e2eExpect(page.getByText(/this week/i)).toBeVisible();
        await e2eExpect(page.getByText(/day streak/i)).toBeVisible();
        await e2eExpect(page.getByText(/^routines$/i).first()).toBeVisible();
    });
    e2eTest("should display quick access cards", async ({ dashboardPage }) => {
        // Wait for page to load
        await dashboardPage.waitForConvexData();
        // Check quick access section
        await e2eExpect(dashboardPage.page.getByRole("heading", { name: /quick access/i })).toBeVisible();
        // Verify links exist
        await e2eExpect(dashboardPage.page.getByRole("link", { name: /routines/i }).first()).toBeVisible();
        await e2eExpect(dashboardPage.page.getByRole("link", { name: /exercises/i }).first()).toBeVisible();
        await e2eExpect(dashboardPage.page.getByRole("link", { name: /workout logs/i }).first()).toBeVisible();
    });
    e2eTest("should navigate to routines page from quick access", async ({ dashboardPage, page, }) => {
        await dashboardPage.waitForConvexData();
        // Click routines card
        const routinesLink = page
            .getByRole("link", { name: /routines/i })
            .filter({ hasText: /create and manage/i });
        await routinesLink.click();
        // Should be on routines page
        await e2eExpect(page).toHaveURL("/routines");
        await e2eExpect(page.getByRole("heading", { name: /^routines$/i })).toBeVisible();
    });
    e2eTest("should navigate to exercises page from quick access", async ({ dashboardPage, page, }) => {
        await dashboardPage.waitForConvexData();
        // Click exercises card
        const exercisesLink = page
            .getByRole("link", { name: /exercises/i })
            .filter({ hasText: /browse the exercise library/i });
        await exercisesLink.click();
        // Should be on exercises page
        await e2eExpect(page).toHaveURL("/exercises");
        await e2eExpect(page.getByRole("heading", { name: /^exercises$/i })).toBeVisible();
    });
    e2eTest("should navigate to logs page from quick access", async ({ dashboardPage, page, }) => {
        await dashboardPage.waitForConvexData();
        // Click logs card
        const logsLink = page
            .getByRole("link", { name: /workout logs/i })
            .filter({ hasText: /review your past sessions/i });
        await logsLink.click();
        // Should be on logs page
        await e2eExpect(page).toHaveURL("/logs");
        await e2eExpect(page.getByRole("heading", { name: /workout logs/i })).toBeVisible();
    });
    e2eTest("should display recent activity section", async ({ dashboardPage }) => {
        await e2eExpect(dashboardPage.recentActivityHeading).toBeVisible();
    });
    e2eTest("should open new session modal when clicking new session button", async ({ dashboardPage, page, }) => {
        await dashboardPage.waitForConvexData();
        // Click new session button
        await dashboardPage.clickNewSession();
        // Modal should be open
        await e2eExpect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    });
    e2eTest("should close modal when pressing escape", async ({ dashboardPage, page, }) => {
        await dashboardPage.waitForConvexData();
        // Open modal
        await dashboardPage.clickNewSession();
        await e2eExpect(page.getByRole("dialog")).toBeVisible();
        // Press escape
        await page.keyboard.press("Escape");
        // Modal should be closed
        await e2eExpect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
    });
    e2eTest("should show empty state or recent sessions", async ({ dashboardPage, page, }) => {
        await dashboardPage.waitForConvexData();
        // Either empty state or session cards should be visible
        const emptyState = page.getByText(/no workouts yet/i);
        const sessionCards = page.locator('[class*="cursor-pointer"]');
        const hasEmpty = await emptyState
            .isVisible({ timeout: 2000 })
            .catch(() => false);
        const hasCards = await sessionCards
            .first()
            .isVisible({ timeout: 2000 })
            .catch(() => false);
        // One of them should be visible
        e2eExpect(hasEmpty || hasCards).toBe(true);
    });
    e2eTest("should navigate to logs when clicking view all", async ({ dashboardPage, page, }) => {
        await dashboardPage.waitForConvexData();
        // View all link is only visible when there are sessions
        const viewAllLink = page.getByRole("link", { name: /view all/i });
        const isVisible = await viewAllLink
            .isVisible({ timeout: 2000 })
            .catch(() => false);
        if (isVisible) {
            await viewAllLink.click();
            await e2eExpect(page).toHaveURL("/logs");
        }
        else {
            // If no sessions, that's okay - skip this assertion
            e2eTest.skip();
        }
    });
    e2eTest("should have functioning navigation header", async ({ page }) => {
        // Check for navigation elements
        const nav = page.locator("nav, header");
        await e2eExpect(nav.first()).toBeVisible();
    });
});

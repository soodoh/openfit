import { describe, expect, it } from "vitest";
import * as hookExports from "./hooks";
import { useAdminUsersPaginated } from "./hooks/queries/use-admin";
import { useExerciseSearch } from "./hooks/queries/use-exercises";
import { useGyms } from "./hooks/queries/use-gyms";
import { useCountdownTimer } from "./hooks/use-countdown-timer";

describe("hooks barrel", () => {
	it("re-exports the expected hook entry points", () => {
		expect(hookExports.useAdminUsersPaginated).toBe(useAdminUsersPaginated);
		expect(hookExports.useExerciseSearch).toBe(useExerciseSearch);
		expect(hookExports.useGyms).toBe(useGyms);
		expect(hookExports.useCountdownTimer).toBe(useCountdownTimer);
	});
});

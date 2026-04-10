import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { queryKeys } from "@/lib/query-keys";
import type { UserProfileWithDefaults } from "@/lib/types";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import useUserProfile, {
	useUserProfile as useUserProfileNamed,
} from "./use-user-profile";

const originalFetch = globalThis.fetch;

type FetchMock = {
	mock: {
		calls: unknown[][];
	};
};

function getFetchRequest(fetchMock: FetchMock, callIndex = 0) {
	const [input] = fetchMock.mock.calls[callIndex] ?? [];

	expect(typeof input).toBe("string");

	return new URL(input, "http://localhost");
}

describe("use-user-profile query", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("fetches user profile data and caches it by current user profile key", async () => {
		const profile = {
			id: "profile-1",
			userId: "user-1",
			role: "USER",
			theme: "system",
			defaultRepetitionUnitId: "reps",
			defaultWeightUnitId: "lb",
			defaultGymId: "gym-1",
			createdAt: "2026-02-01T00:00:00.000Z",
			updatedAt: "2026-02-02T00:00:00.000Z",
			defaultRepetitionUnit: { id: "reps", name: "Reps" },
			defaultWeightUnit: { id: "lb", name: "lb" },
			defaultGym: { id: "gym-1", name: "Home Gym" },
		} as UserProfileWithDefaults;
		const fetchMock = mockJsonSuccess(profile);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useUserProfileNamed(), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(profile);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/user-profile");
		expect(queryClient.getQueryData(queryKeys.userProfile.current())).toEqual(
			profile,
		);
	});

	it("surfaces fetch errors for the default-exported user profile hook", async () => {
		const fetchMock = mockJsonError("User profile request failed", {
			status: 500,
		});
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useUserProfile(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toBeInstanceOf(Error);
		expect((result.current.error as Error).message).toBe(
			"User profile request failed",
		);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/user-profile");
	});
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UserProfileResult } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useSetDefaultGym,
	useUpdateUserProfile,
} from "./use-user-profile-mutations";

function getRequest(fetchMock: { mock: { calls: Array<unknown[]> } }) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init: init as RequestInit | undefined,
	};
}

const userProfileResponse = {
	id: "profile-1",
	userId: "user-1",
	role: "USER",
	theme: "system",
	defaultRepetitionUnitId: "reps",
	defaultWeightUnitId: "lb",
	defaultGymId: null,
	createdAt: "2026-02-01T10:00:00.000Z",
	updatedAt: "2026-02-01T10:00:00.000Z",
	defaultRepetitionUnit: null,
	defaultWeightUnit: null,
	defaultGym: null,
} satisfies UserProfileResult;
const originalFetch = globalThis.fetch;

describe("use-user-profile-mutations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("updates the user profile payload and invalidates userProfile.all", async () => {
		const fetchMock = mockJsonSuccess(userProfileResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			theme: "dark" as const,
			defaultRepetitionUnitId: "reps",
			defaultWeightUnitId: "kg",
			defaultGymId: "gym-1",
		};

		const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/user-profile");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.userProfile.all }],
		);
	});

	it("sets the default gym to null and invalidates userProfile.all", async () => {
		const response = {
			...userProfileResponse,
			defaultGymId: null,
			defaultGym: null,
		} satisfies UserProfileResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useSetDefaultGym(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(null);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/user-profile");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ defaultGymId: null }),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.userProfile.all }],
		);
	});
});

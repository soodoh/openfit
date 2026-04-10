import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { queryKeys } from "@/lib/query-keys";
import type { Units } from "@/lib/types";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useCategories,
	useEquipment,
	useMuscleGroups,
	useUnits,
} from "./use-lookups";

function getFetchRequest(fetchMock: ReturnType<typeof mockJsonSuccess>) {
	const [input] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return new URL(input, "http://localhost");
}

const originalFetch = globalThis.fetch;

describe("use-lookups queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it.each([
		[
			"useEquipment",
			useEquipment,
			queryKeys.lookups.equipment(),
			"/api/lookups/equipment",
			[{ id: "equipment-1", name: "Barbell" }],
		],
		[
			"useMuscleGroups",
			useMuscleGroups,
			queryKeys.lookups.muscleGroups(),
			"/api/lookups/muscle-groups",
			[{ id: "muscle-1", name: "Chest" }],
		],
		[
			"useCategories",
			useCategories,
			queryKeys.lookups.categories(),
			"/api/lookups/categories",
			[{ id: "category-1", name: "Chest" }],
		],
	] as const)("fetches and caches %s lookup data", async (_label, hook, queryKey, pathname, items) => {
		const fetchMock = mockJsonSuccess(items);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => hook(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(items);
		expect(getFetchRequest(fetchMock).pathname).toBe(pathname);
		expect(queryClient.getQueryData(queryKey)).toEqual(items);
	});

	it("requests units from the units lookup endpoint", async () => {
		const units = {
			repetitionUnits: [{ id: "reps", name: "reps" }],
			weightUnits: [{ id: "kg", name: "kg" }],
		} satisfies Units;
		const fetchMock = mockJsonSuccess(units);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useUnits(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(units);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/lookups/units");
	});

	it("surfaces lookup errors", async () => {
		const fetchMock = mockJsonError("Lookup fetch failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useCategories(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe("Lookup fetch failed");
	});
});

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import type { Equipment, Units } from "@/lib/types";
import { mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import { useEquipment, useUnits } from "./use-lookups";

function getFetchRequest(fetchMock: ReturnType<typeof mockJsonSuccess>) {
	const [input] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return new URL(input, "http://localhost");
}

describe("use-lookups queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("keeps stable equipment lookup data across rerenders", async () => {
		const equipment = [
			{ id: "equipment-1", name: "Barbell" },
		] satisfies Equipment[];
		const fetchMock = mockJsonSuccess(equipment);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result, rerender } = renderHook(() => useEquipment(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		rerender();

		await waitFor(() => {
			expect(result.current.data).toEqual(equipment);
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/lookups/equipment");
		expect(queryClient.getQueryData(queryKeys.lookups.equipment())).toEqual(
			equipment,
		);
	});

	it("requests units from the units lookup endpoint", async () => {
		const units = {
			repetitionUnits: [{ id: "reps", name: "reps" }],
			weightUnits: [{ id: "kg", name: "kg" }],
		} satisfies Units;
		const fetchMock = mockJsonSuccess(units);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useUnits(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(units);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/lookups/units");
	});
});

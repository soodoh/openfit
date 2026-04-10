import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { ThemeEnum } from "@/db/schema/user-data";
import type { Gym, Units, UserProfile } from "@/lib/types";
import { useProfileSettingsForm } from "./use-profile-settings-form";

const mockSetTheme = vi.fn();
const mockUpdateProfile = vi.fn();
const mockCreateGym = vi.fn();
const mockUpdateGym = vi.fn();
const mockUseUserProfile = vi.fn();
const mockUseGyms = vi.fn();
const mockUseUnits = vi.fn();

const mockProfile: UserProfile = {
	id: "profile-1",
	userId: "user-1",
	role: "USER",
	defaultGymId: "gym-1",
	defaultWeightUnitId: undefined,
	defaultRepetitionUnitId: undefined,
	theme: "invalid" as UserProfile["theme"],
	createdAt: new Date("2026-04-01T00:00:00.000Z"),
	updatedAt: new Date("2026-04-01T00:00:00.000Z"),
};

const mockGyms: Gym[] = [
	{
		id: "gym-1",
		userId: "user-1",
		name: "Home Gym",
		equipmentIds: ["rack"],
		createdAt: new Date("2026-04-01T00:00:00.000Z"),
		updatedAt: new Date("2026-04-01T00:00:00.000Z"),
	},
];

const mockUnits: Units = {
	repetitionUnits: [
		{ id: "rep-default", name: "Repetitions" },
		{ id: "rep-alt", name: "Sets" },
	],
	weightUnits: [
		{ id: "weight-default", name: "lb" },
		{ id: "weight-alt", name: "kg" },
	],
};

vi.mock("next-themes", () => ({
	useTheme: () => ({
		setTheme: mockSetTheme,
	}),
}));

vi.mock("@/hooks", () => ({
	useCreateGym: () => ({
		mutateAsync: mockCreateGym,
	}),
	useGyms: () => mockUseGyms(),
	useUnits: () => mockUseUnits(),
	useUpdateGym: () => ({
		mutateAsync: mockUpdateGym,
	}),
	useUpdateUserProfile: () => ({
		mutateAsync: mockUpdateProfile,
	}),
	useUserProfile: () => mockUseUserProfile(),
}));

describe("useProfileSettingsForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseUserProfile.mockReturnValue({
			data: mockProfile,
			isLoading: false,
		});
		mockUseGyms.mockReturnValue({
			data: mockGyms,
			isLoading: false,
		});
		mockUseUnits.mockReturnValue({
			data: mockUnits,
			isLoading: false,
		});
		mockUpdateProfile.mockResolvedValue({});
		mockCreateGym.mockResolvedValue({});
		mockUpdateGym.mockResolvedValue({});
	});

	it("hydrates default selections and falls back to system theme", async () => {
		const onClose = vi.fn();
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
			expect(result.current.defaultWeightUnitId).toBe("weight-default");
			expect(result.current.selectedTheme).toBe(ThemeEnum.system);
			expect(result.current.activeTab).toBe("settings");
			expect(result.current.showGymList).toBe(true);
		});
	});

	it("saves profile settings and closes the modal", async () => {
		const onClose = vi.fn();
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
		});

		act(() => {
			result.current.setDefaultRepUnitId("rep-alt");
			result.current.setDefaultWeightUnitId("weight-alt");
			result.current.handleThemeChange("dark");
		});

		await act(async () => {
			await result.current.handleSubmitSettings({
				preventDefault: vi.fn(),
			} as never);
		});

		expect(mockUpdateProfile).toHaveBeenCalledWith({
			defaultRepetitionUnitId: "rep-alt",
			defaultWeightUnitId: "weight-alt",
			theme: ThemeEnum.dark,
		});
		expect(mockSetTheme).toHaveBeenCalledWith(ThemeEnum.dark);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("creates a gym and resets the draft after submit", async () => {
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose: vi.fn() }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
		});

		act(() => {
			result.current.handleOpenAddGym();
			result.current.setGymName("Garage Gym");
			result.current.setSelectedEquipmentIds(["rack", "bench"]);
		});

		await act(async () => {
			await result.current.handleSubmitGym({
				preventDefault: vi.fn(),
			} as never);
		});

		expect(mockCreateGym).toHaveBeenCalledWith({
			name: "Garage Gym",
			equipmentIds: ["rack", "bench"],
		});
		expect(result.current.gymName).toBe("");
		expect(result.current.selectedEquipmentIds).toEqual([]);
		expect(result.current.isAddingGym).toBe(false);
	});

	it("updates an existing gym when editing", async () => {
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose: vi.fn() }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
		});

		act(() => {
			result.current.handleEditGym(mockGyms[0]);
			result.current.setGymName("Updated Gym");
			result.current.setSelectedEquipmentIds(["rack"]);
		});

		await act(async () => {
			await result.current.handleSubmitGym({
				preventDefault: vi.fn(),
			} as never);
		});

		expect(mockUpdateGym).toHaveBeenCalledWith({
			id: "gym-1",
			name: "Updated Gym",
			equipmentIds: ["rack"],
		});
	});

	it("uses the fallback update error message for non-Error failures", async () => {
		mockUpdateGym.mockRejectedValueOnce("boom");
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose: vi.fn() }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
		});

		act(() => {
			result.current.handleEditGym(mockGyms[0]);
			result.current.setGymName("Updated Gym");
			result.current.setSelectedEquipmentIds(["rack"]);
		});

		await act(async () => {
			await result.current.handleSubmitGym({
				preventDefault: vi.fn(),
			} as never);
		});

		expect(result.current.gymError).toBe("Failed to update gym");
	});

	it("falls back to the first available units when preferred unit names are missing", async () => {
		mockUseUnits.mockReturnValue({
			data: {
				repetitionUnits: [
					{ id: "rep-first", name: "Seconds" },
					{ id: "rep-second", name: "Rounds" },
				],
				weightUnits: [
					{ id: "weight-first", name: "stone" },
					{ id: "weight-second", name: "oz" },
				],
			},
			isLoading: false,
		});
		mockUseUserProfile.mockReturnValue({
			data: {
				...mockProfile,
				defaultRepetitionUnitId: undefined,
				defaultWeightUnitId: undefined,
			},
			isLoading: false,
		});

		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose: vi.fn() }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-first");
			expect(result.current.defaultWeightUnitId).toBe("weight-first");
		});
	});

	it("rejects invalid theme and tab values", async () => {
		const onClose = vi.fn();
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose }),
		);

		act(() => {
			result.current.handleThemeChange("not-a-theme");
			result.current.handleTabChange("not-a-tab");
		});

		expect(result.current.selectedTheme).toBe(ThemeEnum.system);
		expect(result.current.activeTab).toBe("settings");
	});

	it("requires both units before saving settings", async () => {
		const onClose = vi.fn();
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
		});

		act(() => {
			result.current.setDefaultRepUnitId("");
		});

		await act(async () => {
			await result.current.handleSubmitSettings({
				preventDefault: vi.fn(),
			} as never);
		});

		expect(result.current.error).toBe("Please select both units");
		expect(mockUpdateProfile).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("surfaces profile save failures", async () => {
		mockUpdateProfile.mockRejectedValueOnce(new Error("save failed"));
		const onClose = vi.fn();
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
		});

		await act(async () => {
			await result.current.handleSubmitSettings({
				preventDefault: vi.fn(),
			} as never);
		});

		expect(result.current.error).toBe("Failed to save profile settings");
		expect(onClose).not.toHaveBeenCalled();
	});

	it("validates gym drafts before creating", async () => {
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose: vi.fn() }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
		});

		act(() => {
			result.current.handleOpenAddGym();
		});

		await act(async () => {
			await result.current.handleSubmitGym({
				preventDefault: vi.fn(),
			} as never);
		});

		expect(result.current.gymError).toBe("Gym name is required");
		expect(mockCreateGym).not.toHaveBeenCalled();
	});

	it("uses the fallback create error message for non-Error failures", async () => {
		mockCreateGym.mockRejectedValueOnce("boom");
		const { result } = await renderHook(() =>
			useProfileSettingsForm({ open: true, onClose: vi.fn() }),
		);

		await vi.waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
		});

		act(() => {
			result.current.handleOpenAddGym();
			result.current.setGymName("Garage Gym");
			result.current.setSelectedEquipmentIds(["rack"]);
		});

		await act(async () => {
			await result.current.handleSubmitGym({
				preventDefault: vi.fn(),
			} as never);
		});

		expect(result.current.gymError).toBe("Failed to create gym");
	});
});

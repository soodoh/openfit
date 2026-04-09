import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
		const { result } = renderHook(() =>
			useProfileSettingsForm({ open: true, onClose }),
		);

		await waitFor(() => {
			expect(result.current.defaultRepUnitId).toBe("rep-default");
			expect(result.current.defaultWeightUnitId).toBe("weight-default");
			expect(result.current.selectedTheme).toBe(ThemeEnum.system);
			expect(result.current.activeTab).toBe("settings");
			expect(result.current.showGymList).toBe(true);
		});
	});

	it("saves profile settings and closes the modal", async () => {
		const onClose = vi.fn();
		const { result } = renderHook(() =>
			useProfileSettingsForm({ open: true, onClose }),
		);

		await waitFor(() => {
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
		const { result } = renderHook(() =>
			useProfileSettingsForm({ open: true, onClose: vi.fn() }),
		);

		await waitFor(() => {
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
		const { result } = renderHook(() =>
			useProfileSettingsForm({ open: true, onClose: vi.fn() }),
		);

		await waitFor(() => {
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

	it("rejects invalid theme and tab values", () => {
		const onClose = vi.fn();
		const { result } = renderHook(() =>
			useProfileSettingsForm({ open: true, onClose }),
		);

		act(() => {
			result.current.handleThemeChange("not-a-theme");
			result.current.handleTabChange("not-a-tab");
		});

		expect(result.current.selectedTheme).toBe(ThemeEnum.system);
		expect(result.current.activeTab).toBe("settings");
	});
});

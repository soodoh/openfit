import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { type Theme, ThemeEnum } from "@/db/schema/user-data";
import {
	useCreateGym,
	useGyms,
	useUnits,
	useUpdateGym,
	useUpdateUserProfile,
	useUserProfile,
} from "@/hooks";
import type { Gym } from "@/lib/types";

export type Tab = "settings" | "equipment";

const TAB_VALUES: readonly Tab[] = ["settings", "equipment"];

function isTab(value: string): value is Tab {
	return TAB_VALUES.some((tab) => tab === value);
}

function isTheme(value: string | undefined): value is Theme {
	return (
		value === ThemeEnum.light ||
		value === ThemeEnum.dark ||
		value === ThemeEnum.system
	);
}

function getSettingsLoading(
	profileLoading: boolean,
	unitsLoading: boolean,
): boolean {
	return profileLoading || unitsLoading;
}

export function useProfileSettingsForm(options: {
	open: boolean;
	onClose: () => void;
}) {
	const { open, onClose } = options;
	const { setTheme } = useTheme();
	const { data: profile, isLoading: profileLoading } = useUserProfile();
	const { data: gymsData, isLoading: gymsLoading } = useGyms();
	const { data: units, isLoading: unitsLoading } = useUnits();
	const updateProfileMutation = useUpdateUserProfile();
	const createGymMutation = useCreateGym();
	const updateGymMutation = useUpdateGym();
	const [activeTab, setActiveTab] = useState<Tab>("settings");
	const [defaultRepUnitId, setDefaultRepUnitId] = useState("");
	const [defaultWeightUnitId, setDefaultWeightUnitId] = useState("");
	const [selectedTheme, setSelectedTheme] = useState<Theme>("system");
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);
	const [isAddingGym, setIsAddingGym] = useState(false);
	const [editingGym, setEditingGym] = useState<Gym | undefined>(undefined);
	const [gymName, setGymName] = useState("");
	const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
		[],
	);
	const [gymError, setGymError] = useState<string | undefined>(undefined);
	const [isGymPending, setIsGymPending] = useState(false);
	const [gymToDelete, setGymToDelete] = useState<Gym | undefined>(undefined);

	const resetGymForm = useCallback(() => {
		setIsAddingGym(false);
		setEditingGym(undefined);
		setGymName("");
		setSelectedEquipmentIds([]);
		setGymError(undefined);
	}, []);

	useEffect(() => {
		if (open && profile && units) {
			const repUnitId =
				profile.defaultRepetitionUnitId ??
				units.repetitionUnits.find((unit) => unit.name === "Repetitions")?.id ??
				units.repetitionUnits[0]?.id ??
				"";
			const weightUnitId =
				profile.defaultWeightUnitId ??
				units.weightUnits.find((unit) => unit.name === "lb")?.id ??
				units.weightUnits[0]?.id ??
				"";
			const theme = isTheme(profile.theme) ? profile.theme : ThemeEnum.system;

			setDefaultRepUnitId(repUnitId);
			setDefaultWeightUnitId(weightUnitId);
			setSelectedTheme(theme);
			setError(undefined);
			setActiveTab("settings");
			resetGymForm();
		}
	}, [open, profile, units, resetGymForm]);

	const handleTabChange = useCallback(
		(value: string) => {
			if (!isTab(value)) {
				return;
			}

			setActiveTab(value);
			resetGymForm();
		},
		[resetGymForm],
	);

	const handleThemeChange = useCallback((value: string) => {
		if (isTheme(value)) {
			setSelectedTheme(value);
		}
	}, []);

	const handleEditGym = useCallback((gym: Gym) => {
		setEditingGym(gym);
		setGymName(gym.name);
		setSelectedEquipmentIds(gym.equipmentIds || []);
		setIsAddingGym(true);
	}, []);

	const handleOpenAddGym = useCallback(() => {
		setIsAddingGym(true);
	}, []);

	const handleSubmitSettings = useCallback(
		async (event: React.SubmitEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!defaultRepUnitId || !defaultWeightUnitId) {
				setError("Please select both units");
				return;
			}

			setIsPending(true);
			setError(undefined);

			try {
				await updateProfileMutation.mutateAsync({
					defaultRepetitionUnitId: defaultRepUnitId,
					defaultWeightUnitId: defaultWeightUnitId,
					theme: selectedTheme,
				});
				setTheme(selectedTheme);
				onClose();
			} catch {
				setError("Failed to save profile settings");
			} finally {
				setIsPending(false);
			}
		},
		[
			defaultRepUnitId,
			defaultWeightUnitId,
			onClose,
			selectedTheme,
			setTheme,
			updateProfileMutation,
		],
	);

	const handleSubmitGym = useCallback(
		async (event: React.SubmitEvent<HTMLFormElement>) => {
			event.preventDefault();
			setGymError(undefined);

			if (!gymName.trim()) {
				setGymError("Gym name is required");
				return;
			}

			if (selectedEquipmentIds.length === 0) {
				setGymError("Select at least one piece of equipment");
				return;
			}

			setIsGymPending(true);

			try {
				await (editingGym
					? updateGymMutation.mutateAsync({
							id: editingGym.id,
							name: gymName.trim(),
							equipmentIds: selectedEquipmentIds,
						})
					: createGymMutation.mutateAsync({
							name: gymName.trim(),
							equipmentIds: selectedEquipmentIds,
						}));
				resetGymForm();
			} catch (caughtError) {
				setGymError(
					caughtError instanceof Error
						? caughtError.message
						: `Failed to ${editingGym ? "update" : "create"} gym`,
				);
			} finally {
				setIsGymPending(false);
			}
		},
		[
			createGymMutation,
			editingGym,
			gymName,
			resetGymForm,
			selectedEquipmentIds,
			updateGymMutation,
		],
	);

	return {
		activeTab,
		defaultRepUnitId,
		defaultWeightUnitId,
		editingGym,
		error,
		gymError,
		gymName,
		gymSubmitLabel: editingGym ? "Save Changes" : "Add Gym",
		gymToDelete,
		gymsData,
		handleEditGym,
		handleOpenAddGym,
		handleSubmitGym,
		handleSubmitSettings,
		handleTabChange,
		handleThemeChange,
		isAddingGym,
		isGymPending,
		isGymsLoading: gymsLoading,
		isLoading: getSettingsLoading(profileLoading, unitsLoading),
		isPending,
		profile,
		resetGymForm,
		selectedEquipmentIds,
		selectedTheme,
		setDefaultRepUnitId,
		setDefaultWeightUnitId,
		setGymName,
		setGymToDelete,
		setSelectedEquipmentIds,
		showGymList: !gymsLoading && !isAddingGym,
		units,
	} as const;
}

export default useProfileSettingsForm;

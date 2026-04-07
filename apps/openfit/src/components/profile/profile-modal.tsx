import {
	AlertCircle,
	Dumbbell,
	Loader2,
	Plus,
	Settings,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import { DeleteGymModal } from "@/components/gyms/delete-gym-modal";
import { EquipmentSelector } from "@/components/gyms/equipment-selector";
import { GymCard } from "@/components/gyms/gym-card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Tab, useProfileSettingsForm } from "./use-profile-settings-form";

const TAB_ICONS = {
	settings: Settings,
	equipment: Dumbbell,
} as const;
const THEME_OPTIONS = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "system", label: "System" },
];
export const ProfileModal = ({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}): ReactNode => {
	const {
		activeTab,
		defaultRepUnitId,
		defaultWeightUnitId,
		editingGym,
		error,
		gymError,
		gymName,
		gymSubmitLabel,
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
		isGymsLoading,
		isLoading,
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
		showGymList,
		units,
	} = useProfileSettingsForm({
		open,
		onClose,
	});
	const ActiveTabIcon = TAB_ICONS[activeTab];
	return (
		<Dialog open={open} onOpenChange={() => onClose()}>
			<DialogContent className="sm:max-w-[520px] p-0 overflow-hidden max-h-[85vh] flex flex-col">
				{/* Header */}
				<DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
							<ActiveTabIcon className="h-5 w-5 text-primary dark:text-foreground" />
						</div>
						<div>
							<DialogTitle className="text-xl">Profile Settings</DialogTitle>
							<DialogDescription className="text-sm">
								Customize your preferences and manage gyms
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="flex-1 flex flex-col min-h-0"
				>
					<TabsList className="ml-6 w-fit shrink-0">
						<TabsTrigger value="settings" className="gap-1.5">
							<Settings className="h-4 w-4" />
							Settings
						</TabsTrigger>
						<TabsTrigger value="equipment" className="gap-1.5">
							<Dumbbell className="h-4 w-4" />
							Equipment
						</TabsTrigger>
					</TabsList>

					{/* Tab Content */}
					<TabsContent
						value="settings"
						className="flex-1 overflow-y-auto min-h-0 mt-0"
					>
						<form
							onSubmit={handleSubmitSettings}
							className="flex flex-col h-full"
						>
							<div className="px-6 py-5 space-y-5 flex-1">
								{isLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : (
									<>
										<div className="space-y-2">
											<Label
												htmlFor="default-rep-unit"
												className="text-sm font-medium"
											>
												Default Repetition Unit
											</Label>
											<p className="text-xs text-muted-foreground mb-2">
												Used when adding new exercises to your workouts
											</p>
											<Select
												value={defaultRepUnitId}
												onValueChange={setDefaultRepUnitId}
											>
												<SelectTrigger id="default-rep-unit" className="h-11">
													<SelectValue placeholder="Select repetition unit" />
												</SelectTrigger>
												<SelectContent>
													{units?.repetitionUnits.map((unit) => (
														<SelectItem key={unit.id} value={unit.id}>
															{unit.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label
												htmlFor="default-weight-unit"
												className="text-sm font-medium"
											>
												Default Weight Unit
											</Label>
											<p className="text-xs text-muted-foreground mb-2">
												Used when logging weights in your workouts
											</p>
											<Select
												value={defaultWeightUnitId}
												onValueChange={setDefaultWeightUnitId}
											>
												<SelectTrigger
													id="default-weight-unit"
													className="h-11"
												>
													<SelectValue placeholder="Select weight unit" />
												</SelectTrigger>
												<SelectContent>
													{units?.weightUnits.map((unit) => (
														<SelectItem key={unit.id} value={unit.id}>
															{unit.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label htmlFor="theme" className="text-sm font-medium">
												Theme
											</Label>
											<p className="text-xs text-muted-foreground mb-2">
												Choose your preferred color theme
											</p>
											<Select
												value={selectedTheme}
												onValueChange={handleThemeChange}
											>
												<SelectTrigger id="theme" className="h-11">
													<SelectValue placeholder="Select theme" />
												</SelectTrigger>
												<SelectContent>
													{THEME_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										{error && (
											<p className="text-sm text-destructive flex items-center gap-1.5">
												<AlertCircle className="h-3.5 w-3.5" />
												{error}
											</p>
										)}
									</>
								)}
							</div>

							<DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 shrink-0">
								<Button
									type="button"
									variant="ghost"
									onClick={onClose}
									className="mr-2"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isPending || isLoading}
									className="min-w-[100px]"
								>
									{isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Saving...
										</>
									) : (
										"Save Changes"
									)}
								</Button>
							</DialogFooter>
						</form>
					</TabsContent>

					<TabsContent
						value="equipment"
						className="flex-1 overflow-y-auto min-h-0 mt-0"
					>
						<div className="flex flex-col h-full">
							<div className="px-6 py-5 flex-1">
								{isGymsLoading && (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								)}
								{!isGymsLoading && isAddingGym && (
									// Gym form (add/edit)
									<form onSubmit={handleSubmitGym} className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="text-sm font-medium">
												{editingGym ? "Edit Gym" : "Add New Gym"}
											</h3>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={resetGymForm}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>

										<div className="space-y-2">
											<Label htmlFor="gym-name" className="text-sm font-medium">
												Gym Name
											</Label>
											<Input
												id="gym-name"
												placeholder="e.g., Home Gym, Planet Fitness"
												value={gymName}
												onChange={(e) => setGymName(e.target.value)}
												className="h-11"
											/>
										</div>

										<div className="space-y-2">
											<Label className="text-sm font-medium">Equipment</Label>
											<p className="text-xs text-muted-foreground">
												Select the equipment available at this gym
											</p>
											<EquipmentSelector
												selectedIds={selectedEquipmentIds}
												onSelectionChange={setSelectedEquipmentIds}
											/>
										</div>

										{gymError && (
											<p className="text-sm text-destructive flex items-center gap-1.5">
												<AlertCircle className="h-3.5 w-3.5" />
												{gymError}
											</p>
										)}

										<div className="flex justify-end gap-2 pt-2">
											<Button
												type="button"
												variant="ghost"
												onClick={resetGymForm}
											>
												Cancel
											</Button>
											<Button type="submit" disabled={isGymPending}>
												{isGymPending ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Saving...
													</>
												) : (
													gymSubmitLabel
												)}
											</Button>
										</div>
									</form>
								)}
								{showGymList && (
									// Gym list
									<div className="space-y-3">
										{gymsData && gymsData.length > 0 ? (
											<>
												{gymsData.map((gym) => (
													<GymCard
														key={gym.id}
														gym={gym}
														isDefault={profile?.defaultGymId === gym.id}
														onEdit={() => handleEditGym(gym)}
														onDelete={() => setGymToDelete(gym)}
													/>
												))}
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="w-full mt-2"
													onClick={handleOpenAddGym}
												>
													<Plus className="h-4 w-4 mr-1" />
													Add Gym
												</Button>
											</>
										) : (
											<div className="text-center py-8 space-y-3">
												<div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
													<Dumbbell className="h-6 w-6 text-muted-foreground" />
												</div>
												<div>
													<p className="text-sm font-medium">
														No gyms created yet
													</p>
													<p className="text-xs text-muted-foreground mt-1">
														Create a gym to filter exercises by available
														equipment
													</p>
												</div>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={handleOpenAddGym}
												>
													<Plus className="h-4 w-4 mr-1" />
													Add Your First Gym
												</Button>
											</div>
										)}
									</div>
								)}
							</div>

							{/* Footer for equipment tab - only show when not editing */}
							{!isAddingGym && (
								<DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 shrink-0">
									<Button type="button" variant="ghost" onClick={onClose}>
										Close
									</Button>
								</DialogFooter>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>

			<DeleteGymModal
				gym={gymToDelete}
				isLastGym={gymsData?.length === 1}
				onClose={() => setGymToDelete(undefined)}
			/>
		</Dialog>
	);
};
export default ProfileModal;

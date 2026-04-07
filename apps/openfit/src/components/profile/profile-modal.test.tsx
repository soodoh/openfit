import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Gym, Units, UserProfile } from "@/lib/types";
import { ProfileModal } from "./profile-modal";

const mockSetTheme = vi.fn();
const mockUpdateProfile = vi.fn();
const mockCreateGym = vi.fn();
const mockUpdateGym = vi.fn();

const mockProfile: UserProfile = {
	id: "profile-1",
	userId: "user-1",
	role: "USER",
	defaultGymId: "gym-1",
	defaultWeightUnitId: "weight-lb",
	defaultRepetitionUnitId: "rep-reps",
	theme: "system",
	createdAt: new Date("2026-04-01T00:00:00.000Z"),
	updatedAt: new Date("2026-04-01T00:00:00.000Z"),
};

const mockUnits: Units = {
	repetitionUnits: [{ id: "rep-reps", name: "Repetitions" }],
	weightUnits: [{ id: "weight-lb", name: "lb" }],
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

vi.mock("next-themes", () => ({
	useTheme: () => ({
		setTheme: mockSetTheme,
	}),
}));

vi.mock("@/hooks", () => ({
	useUserProfile: () => ({
		data: mockProfile,
		isLoading: false,
	}),
	useGyms: () => ({
		data: mockGyms,
		isLoading: false,
	}),
	useUnits: () => ({
		data: mockUnits,
		isLoading: false,
	}),
	useUpdateUserProfile: () => ({
		mutateAsync: mockUpdateProfile,
	}),
	useCreateGym: () => ({
		mutateAsync: mockCreateGym,
	}),
	useUpdateGym: () => ({
		mutateAsync: mockUpdateGym,
	}),
}));

vi.mock("@/components/gyms/delete-gym-modal", () => ({
	DeleteGymModal: () => null,
}));

vi.mock("@/components/gyms/gym-card", () => ({
	GymCard: ({ gym, onEdit }: { gym: Gym; onEdit: () => void }) => (
		<div>
			<span>{gym.name}</span>
			<button type="button" onClick={onEdit}>
				Edit {gym.name}
			</button>
		</div>
	),
}));

vi.mock("@/components/gyms/equipment-selector", () => ({
	EquipmentSelector: ({
		selectedIds,
		onSelectionChange,
	}: {
		selectedIds: string[];
		onSelectionChange: (ids: string[]) => void;
	}) => (
		<div>
			<div>Selected equipment: {selectedIds.join(",") || "none"}</div>
			<button type="button" onClick={() => onSelectionChange(["bench"])}>
				Choose bench
			</button>
		</div>
	),
}));

describe("ProfileModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateProfile.mockResolvedValue({});
		mockCreateGym.mockResolvedValue({});
		mockUpdateGym.mockResolvedValue({});
	});

	it("resets the gym draft when switching away from the equipment tab", () => {
		render(<ProfileModal open onClose={vi.fn()} />);

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Equipment" }));
		fireEvent.click(screen.getByRole("button", { name: "Edit Home Gym" }));

		const gymNameInput = screen.getByLabelText("Gym Name");
		expect(gymNameInput).toHaveValue("Home Gym");
		expect(screen.getByText("Selected equipment: rack")).toBeInTheDocument();

		fireEvent.change(gymNameInput, { target: { value: "Changed Gym Name" } });
		fireEvent.click(screen.getByRole("button", { name: "Choose bench" }));

		expect(screen.getByLabelText("Gym Name")).toHaveValue("Changed Gym Name");
		expect(screen.getByText("Selected equipment: bench")).toBeInTheDocument();

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Settings" }));
		fireEvent.mouseDown(screen.getByRole("tab", { name: "Equipment" }));

		expect(screen.queryByLabelText("Gym Name")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Add Gym" }));

		expect(
			screen.getByRole("heading", { name: "Add New Gym" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Gym Name")).toHaveValue("");
		expect(screen.getByText("Selected equipment: none")).toBeInTheDocument();
	});
});
